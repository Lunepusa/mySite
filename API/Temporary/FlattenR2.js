import {getUser} from "../Auth/GetUser.js";

 export async function flattenR2(request, env) {
     const bucket = env.Media;
 const bucketName = "lunepusa";
 const db = env.Db;
 const kv = env.kv;
        // ADDED LIMIT 50: This avoids hitting Cloudflare's sub-request maximum limit.
        // Every time you refresh, it pulls the next 50 un-migrated items.

  const { results } = await db
    .prepare(
      `SELECT id, object_key, tags 
       FROM media 
       WHERE object_key LIKE 'media/________/%'
       ORDER BY id ASC
       LIMIT 50`
    )
    .all();

  if (results.length === 0) {
    return Response.json({
      success: true,
      message: "🎉 All historical items have already been completely flattened! There is nothing left to migrate.",
    });
  }

  let movedCount = 0;
  let dbUpdatedCount = 0;
  const resultsLog = [];

  for (const row of results) {
    const oldKey = row.object_key;

    const pathMatch = oldKey.match(/^media\/\d{8}\/(.+)$/);
    if (!pathMatch) continue;

    const originalFilename = pathMatch[1];
    const dotIndex = originalFilename.lastIndexOf(".");
    const baseName = dotIndex !== -1 ? originalFilename.substring(0, dotIndex) : originalFilename;
    const extension = dotIndex !== -1 ? originalFilename.substring(dotIndex) : "";

    let targetFilename = originalFilename;
    let newKey = `media/${targetFilename}`;
    let updatedTags = row.tags || "";

    const conflictCheck = await db
      .prepare("SELECT id, tags FROM media WHERE object_key = ? AND id != ?")
      .bind(newKey, row.id)
      .first();

    if (conflictCheck) {
      if (row.id < conflictCheck.id) {
        targetFilename = `${baseName}_duplicate${extension}`;
        newKey = `media/${targetFilename}`;
        updatedTags = updatedTags ? `${updatedTags}, delete` : "delete";
        resultsLog.push(`[Conflict Resolved] Older row found. Marking duplicate: ${newKey}`);
      } else {
        const olderRowId = conflictCheck.id;
        const olderRowTags = conflictCheck.tags || "";
        const olderTargetFilename = `${baseName}_duplicate${extension}`;
        const oldernewKey = `media/${olderTargetFilename}`;
        const olderUpdatedTags = olderRowTags ? `${olderRowTags}, delete` : "delete";

        resultsLog.push(`[Conflict Resolved] Existing row is older. Relocating old row to: ${oldernewKey}`);

        await db
          .prepare("UPDATE media SET object_key = ?, tags = ? WHERE id = ?")
          .bind(oldernewKey, olderUpdatedTags, olderRowId)
          .run();

        // Local try/catch is correct here so the loop doesn't break if R2 fetch fails
        try {
          const sourceObjectOlder = await bucket.get(newKey);
          if (sourceObjectOlder) {
            await bucket.put(oldernewKey, sourceObjectOlder.body, {
              customMetadata: sourceObjectOlder.customMetadata,
              httpMetadata: sourceObjectOlder.httpMetadata,
            });
            await bucket.delete(newKey);
            movedCount++;
          }
        } catch (e) {
          console.log(`Older asset wasn't present at clean destination yet.`);
        }

        targetFilename = originalFilename;
        newKey = `media/${targetFilename}`;
      }
    }

    // A. MOVE FILE IN R2 STORAGE
    try {
      const sourceObject = await bucket.get(oldKey);
      if (sourceObject) {
        await bucket.put(newKey, sourceObject.body, {
          customMetadata: sourceObject.customMetadata,
          httpMetadata: sourceObject.httpMetadata,
        });
        await bucket.delete(oldKey);
        movedCount++;
      }
    } catch (r2Err) {
      resultsLog.push(`[R2 Warning] Object missing from bucket for key: ${oldKey}. Aligning DB anyway.`);
    }

    // B. UPDATE THE CURRENT D1 DATABASE ROW
    await db
      .prepare("UPDATE media SET object_key = ?, tags = ? WHERE id = ?")
      .bind(newKey, updatedTags, row.id)
      .run();

    dbUpdatedCount++;
    resultsLog.push(`Success: ${oldKey} -> ${newKey}`);
  }
  
  const randomColor = "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0");
  
  return Response.json({
    success: true,
    trackingColor: randomColor,
    message: `Batch complete. Successfully flattened ${dbUpdatedCount} rows and moved ${movedCount} files.`,
    log: resultsLog,
  });
}