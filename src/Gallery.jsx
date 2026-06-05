import React, {
	useState,
	useEffect,
	useMemo,
	useCallback,
	useRef
} from "react";
import { useAuth, apiFetch, R2_PUBLIC_URL } from "./Auth";
import { TagSelect, searchTags, ClickableTags } from "./Tags";
import Collapse from "./Utility";

// /media path
// const media = mediaList.results.map(row => ({
//      key: row.object_key,
//      date: row.created_date ? String(row.created_date).replace('.0', '') : 'Unknown',
//      caption: row.caption || '',
//      tags: row.tags || '',
//      type: row.file_type,
//      isVideo: row.file_type?.startsWith('video/') || false,
//   }));
// /share path
// const media = mediaList.results.map(row => ({
//              key: row.object_key,
//              date: row.created_date ? String(row.created_date).replace('.0', '') : 'Unknown',
//              caption: row.caption || '',
//              tags: row.tags || '',
//              isVideo: row.file_type?.startsWith('video/') || false,
//            }));

const Gallery = () => {
	const { isSubscriber, isLoggedIn, isAdmin, user, unlockedDates } =
		useAuth();
	const hasAccessForDate = dateString => {
		return (
			isAdmin ||
			isSubscriber ||
			(unlockedDates && unlockedDates.includes(dateString))
		);
	};

	// Main list of loaded media items (photos + videos)
	const [media, setMedia] = useState([]);
	const [offset, setOffset] = useState(0);

	// Use these refs to prevent re-renders in your function

	const offsetRef = useRef(0);
	const loadingRef = useRef(false);
	const hasMoreRef = useRef(true);
	const [loading, setLoading] = useState(false); // Keep this for UI rendering
	const [hasMore, setHasMore] = useState(true);
	const [fullscreenItem, setFullscreenItem] = useState(null);

	// Total counts displayed in header
	const [stats, setStats] = useState({ photos: 0, videos: 0 });

	// Editing states for group caption/tags or single item tags
	const [editingGroupCaption, setEditingGroupCaption] = useState(null);
	const [editingGroupTags, setEditingGroupTags] = useState(null);
	const [editingItem, setEditingItem] = useState(null);

	const [tempCaption, setTempCaption] = useState("");
	const [tempTags, setTempTags] = useState([]);
	const [originalTags, setOriginalTags] = useState([]);

	// Search input and active normalized query
	const [searchInput, setSearchInput] = useState("");
	const [activeSearchQuery, setActiveSearchQuery] = useState("");
	const [displayedQuery, setDisplayedQuery] = useState("");

	// Multi-select mode (admin only)
	const [multiSelectMode, setMultiSelectMode] = useState(false);
	const [selectedItems, setSelectedItems] = useState(() => new Set());
	const ITEMS_PER_BATCH = 50;

	// -------------------------------------------------------------------------
	// Effect: Sync URL hash ↔ search query + reset results on hash change
	// -------------------------------------------------------------------------

	// -------------------------------------------------------------------------
	// Utility: Convert tag string or array into clean array
	// -------------------------------------------------------------------------
	const getTagsArray = tagInput => {
		if (!tagInput) return [];
		if (Array.isArray(tagInput)) return tagInput;
		if (typeof tagInput === "string") {
			return tagInput
				.split(",")
				.map(t => t.trim())
				.filter(t => t.length > 0);
		}
		return [];
	};

	const normalizeSearchInput = input => {
		if (!input.trim()) return "";

		input = input.replace(/&/g, "+");

		const orGroups = input.trim().split(/\s+/);

		const normalizedOrGroups = orGroups.map(group => {
			let isExclude = false;
			if (group.startsWith("-")) {
				isExclude = true;
				group = group.slice(1);
			}

			const andTerms = group.split("+");
			const normalizedAnd = andTerms.map(term => {
				const clean = term.trim();
				const matches = searchTags(clean);
				return matches[0] || clean; // prefer canonical if match exists
			});

			const normalizedGroup = normalizedAnd.join("+");
			return isExclude ? `-${normalizedGroup}` : normalizedGroup;
		});

		return normalizedOrGroups.join("~");
	};

	// 2. STABLE CALLBACK (No 'offset' in dependency array)
	const loadMoreGroups = useCallback(
		async (
			targetOffset, // Pass this in explicitly
			queryToUse,
			ignoreChecks = false
		) => {
			// Check REFS instead of state
			if (!ignoreChecks && (loadingRef.current || !hasMoreRef.current))
				return;

			loadingRef.current = true;
			setLoading(true);

			try {
				const params = new URLSearchParams({
					offset: targetOffset.toString(),
					limit: ITEMS_PER_BATCH.toString()
				});
				if (queryToUse?.trim()) params.append("q", queryToUse);

				const res = await apiFetch(`/media?${params.toString()}`);
				const data = await res.json();

				// Update Refs
				hasMoreRef.current = data.media.length === ITEMS_PER_BATCH;
				offsetRef.current = targetOffset + data.media.length;

				// Update State
				setMedia(prev =>
					targetOffset === 0 ? data.media : [...prev, ...data.media]
				);
				setHasMore(hasMoreRef.current);
			} catch (err) {
				console.error("Load error:", err);
			} finally {
				loadingRef.current = false;
				setLoading(false);
			}
		},
		[activeSearchQuery]
	); // Only re-create if the search query actually changes


	// 1. Create a ref to attach to our button wrapper
	const loadMoreButtonRef = useRef(null);

	// 2. Set up the Intersection Observer
	useEffect(() => {
		const observer = new IntersectionObserver(
			(entries) => {
				const target = entries[0];

				// Trigger only if the button is fully visible, not already loading, and there are more items
				if (target.isIntersecting && !loadingRef.current && hasMoreRef.current) {
					loadMoreGroups(offsetRef.current, activeSearchQuery);
				}
			},
			{
				root: null,
				rootMargin: "0px 0px 200px 0px",
			threshold: 0.1,
			}
		);

		// Start observing
		if (loadMoreButtonRef.current) {
			observer.observe(loadMoreButtonRef.current);
		}

		// Cleanup on unmount
		return () => {
			if (loadMoreButtonRef.current) {
				observer.unobserve(loadMoreButtonRef.current);
			}
		};
	}, [activeSearchQuery, loadMoreGroups]);


	const triggerSearch = () => {
		const normalized = normalizeSearchInput(searchInput);
		setActiveSearchQuery(normalized);
		setDisplayedQuery(normalized || "(no terms)");

		setMedia([]);
		setOffset(0);
		hasMoreRef.current = true;
		setHasMore(true);
		loadMoreGroups(0, normalized, true);

		if (normalized) {
			window.history.pushState(
				null,
				"",
				`#${encodeURIComponent(normalized)}`
			);
		} else {
			window.history.pushState(null, "", window.location.pathname);
		}
	};

	const calculateMultiCommonTags = () => {
		if (selectedItems.size === 0) return [];

		const keys = Array.from(selectedItems);
		const firstItem = media.find(m => m.key === keys[0]);
		if (!firstItem) return [];

		let common = getTagsArray(firstItem.tags);

		for (const key of keys.slice(1)) {
			const item = media.find(m => m.key === key);
			if (!item) continue;
			const itemTags = getTagsArray(item.tags);
			common = common.filter(t => itemTags.includes(t));
		}

		return common;
	};

	const multiCommonTags = useMemo(() => {
		return calculateMultiCommonTags();
	}, [selectedItems.size, media]);

	const groups = useMemo(() => {
		const groupsObj = {};

		media.forEach(item => {
			const date = item.date || "Unknown";
			if (!groupsObj[date]) {
				groupsObj[date] = { items: [], commonTags: [] };
			}
			groupsObj[date].items.push(item);
		});

		Object.keys(groupsObj).forEach(date => {
			const items = groupsObj[date].items;
			if (items.length === 0) return;

			let common = new Set(getTagsArray(items[0].tags));
			for (let i = 1; i < items.length; i++) {
				const itemTags = new Set(getTagsArray(items[i].tags));
				common = new Set([...common].filter(tag => itemTags.has(tag)));
			}
			groupsObj[date].commonTags = [...common];
		});

		return groupsObj;
	}, [media]);

	const sortedDates = useMemo(() => {
		return Object.keys(groups).sort((a, b) => b.localeCompare(a));
	}, [groups]);

	const firstDate = sortedDates[0];

	useEffect(() => {
		const handleHashChange = () => {
			const hash = window.location.hash.slice(1);
			const rawQuery = decodeURIComponent(hash || "");
			const normalized = normalizeSearchInput(rawQuery);

			// Reset
			offsetRef.current = 0;
			hasMoreRef.current = true;
			setMedia([]);
			setSearchInput(rawQuery);
			setActiveSearchQuery(normalized);
			setDisplayedQuery(normalized || "(no terms)");
			setHasMore(true);

			// Fetch
			loadMoreGroups(0, normalized, true);
		};

		// Run once on mount AND on hash change
		handleHashChange();
		window.addEventListener("hashchange", handleHashChange);
		return () => window.removeEventListener("hashchange", handleHashChange);
	}, [loadMoreGroups]); // This is now safe and won't

	// -------------------------------------------------------------------------
	// Effect: Fetch total photo/video counts for header
	// -------------------------------------------------------------------------
	useEffect(() => {
		const fetchStats = async () => {
			try {
				const res = await apiFetch("/gallery-stats");
				if (res.ok) {
					const data = await res.json();
					setStats(data);
				}
			} catch (err) {
				// silent fail
			}
		};
		fetchStats();
	}, []);

	if (loadingRef.current && media.length === 0)
		return (
			<p style={{ textAlign: "center", padding: "6px" }}>
				Loading gallery...
			</p>
		);

	if (media.length === 0)
		return (
			<div style={{ textAlign: "center", padding: "6px" }}>
				{activeSearchQuery ? (
					<>
						<p>No results for: "{displayedQuery}"</p>
						<button
							onClick={() => {
								setSearchInput("");
								setActiveSearchQuery("");
								setDisplayedQuery("");
								setMedia([]);
								setOffset(0);
								hasMoreRef.current = true;
								setHasMore(true);
								loadMoreGroups(0, "", true);
								window.history.pushState(
									null,
									"",
									window.location.pathname
								);
							}}
						>
							Clear search
						</button>
					</>
				) : (
					"No media yet."
				)}
			</div>
		);

	const openFullscreen = item => setFullscreenItem(item);
	const closeFullscreen = () => setFullscreenItem(null);

	const goNext = () => {
		if (fullscreenItem) {
			const currentIndex = media.findIndex(
				m => m.key === fullscreenItem.key
			);
			if (currentIndex < media.length - 1) {
				setFullscreenItem(media[currentIndex + 1]);
			}
		}
	};

	const goPrev = () => {
		if (fullscreenItem) {
			const currentIndex = media.findIndex(
				m => m.key === fullscreenItem.key
			);
			if (currentIndex > 0) {
				setFullscreenItem(media[currentIndex - 1]);
			}
		}
	};

	// -------------------------------------------------------------------------
	// Save edited caption or tags (group or single item)
	// Uses optimistic update on success
	// -------------------------------------------------------------------------
	const saveEdit = async () => {
		// 1. Ensure we are actually editing a caption
		if (!editingGroupCaption) {
			setEditingGroupCaption(null);
			return;
		}

		const cleanGroupKey = editingGroupCaption.toString().replace(".0", "");

		// 2. Since /bulk-update expects an array of 'keys', we gather all keys in this group
		const keysToUpdate = media
			.filter(item => item.date.toString().replace(".0", "") === cleanGroupKey)
			.map(item => item.key);

		if (keysToUpdate.length === 0) {
			setEditingGroupCaption(null);
			return;
		}

		try {
			// 3. Post to the new bulk-update endpoint
			const res = await apiFetch("/bulk-update", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					keys: keysToUpdate,
					newCaption: tempCaption
				})
			});

			if (!res.ok) {
				const errText = await res.text();
				throw new Error(`Save failed: ${res.status} ${errText}`);
			}

			// 4. Update the local React state based on the keys array
			setMedia(prev => {
				return prev.map(item => {
					if (keysToUpdate.includes(item.key)) {
						return { ...item, caption: tempCaption };
					}
					return item;
				});
			});

			// 5. Reset states
			setEditingGroupCaption(null);
			setTempCaption("");
		} catch (err) {
			console.error("Save error:", err);
			alert("Save failed — changes not applied: " + err.message);
		}
	};

	// -------------------------------------------------------------------------
	// Admin: Right-click date header → copy share link for whole date
	// -------------------------------------------------------------------------
	const handleDateShareCopy = date => async e => {
		if (!isAdmin) return;
		e.preventDefault();

		try {
			const res = await apiFetch("/generate-share-token", {
				method: "POST",
				body: JSON.stringify({
					target_type: "date",
					target_value: date
				})
			});
			const data = await res.json();
			if (data.success) {
				navigator.clipboard.writeText(data.link);
				console.log("Date share link copied:", data.link);
			} else {
				console.error(
					"Failed to generate date share link:",
					data.error
				);
			}
		} catch (err) {
			console.error("Date share copy error:", err);
		}
	};

	// -------------------------------------------------------------------------
	// Admin: Right-click media thumbnail/fullscreen → copy item share link
	// -------------------------------------------------------------------------
	const handleMediaShareCopy = item => async e => {
		if (!isAdmin) return;
		e.preventDefault();

		try {
			const res = await apiFetch("/generate-share-token", {
				method: "POST",
				body: JSON.stringify({
					target_type: "media",
					target_value: item.key
				})
			});
			const data = await res.json();
			if (data.success) {
				navigator.clipboard.writeText(data.link);
				console.log("Media share link copied:", data.link);
			} else {
				console.error(
					"Failed to generate media share link:",
					data.error
				);
			}
		} catch (err) {
			console.error("Media share copy error:", err);
		}
	};

	return (
		<>
			{/* Sticky search + stats header */}
			<div
				style={{
					padding: "5px",
					textAlign: "center",
					background: "#111",
					width: "100%",
					maxWidth: "600px",
				}}
			>
				<h1 style={{ marginBottom: "1px" }}>Gallery</h1>
				<h2 style={{ color: "#aaa" }}>
					Total: {stats.photos} photos • {stats.videos} videos
				</h2>

				<div style={{ margin: "5px 0", width: "95%" }}>
					<input
						type="text"
						placeholder="Search, Ex. tits+ass, tits -ass, tits ass,   space=OR, +=AND, -exclude)"
						value={searchInput}
						onChange={e => setSearchInput(e.target.value)}
						onKeyDown={e => {
							if (e.key === "Enter") {
								triggerSearch();
							}
						}}
						style={{
							padding: "8px",
							width: "80%",
							maxWidth: "100%",
							fontSize: "1em",
							borderRadius: "8px",
							border: "1px solid #ccc"
						}}
					/>
					<button
						onClick={triggerSearch}
						style={{ marginLeft: "2px", padding: "1px 3px" }}
					>
						Search
					</button>
					{activeSearchQuery && (
						<>
							<button
								onClick={() => {
									setSearchInput("");
									setActiveSearchQuery("");
									setDisplayedQuery("");
									setMedia([]);
									setOffset(0);
									hasMoreRef.current = true;
									setHasMore(true);
									loadMoreGroups(0, "", true);
									window.history.pushState(
										null,
										"",
										window.location.pathname
									);
								}}
								style={{
									marginLeft: "2px",
									padding: "1px 3px"
								}}
							>
								Clear
							</button>
							<p style={{ fontSize: ".8em", margin: "5px 0" }}>
								Like a particular tag, or want to hide anything
								with a particular tag? You can add them to your{" "}
								<a href="/Profile#collapse-favoritemutedtags">
									favorites or mute lists!
								</a>
							</p>
						</>
					)}
				</div>

				{activeSearchQuery && (
					<p
						style={{
							margin: "5px 0",
							color: "#aaa",
							fontStyle: "italic"
						}}
					>
						Searching for: <strong>"{displayedQuery}"</strong>
					</p>
				)}
			</div>

			{/* Main content wrapper */}
			<div>
				{/* Admin Multi-Select Toggle */}
				{!!isAdmin && (
					<div
						style={{
							position: "sticky",
							top: "2%",
							background: "#333",
							padding: "1px",
							borderRadius: "1px",
							zIndex: 100,
							boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
							color: "#fff",
						}}
					>
						<label style={{ display: "block" }}>
							<input

								type="checkbox"
								checked={multiSelectMode}
								onChange={e => {
									setMultiSelectMode(e.target.checked);
									if (!e.target.checked)
										setSelectedItems(new Set());
								}}
								style={{ width: "fitContent" }}
							/>
							Multi-select ({selectedItems.size} selected)
						</label>

						{multiSelectMode && selectedItems.size > 0 && (
							<div style={{ marginTop: "2px" }}>
								<TagSelect
									initialTags={multiCommonTags.join(",")}
									onSave={(tagsString, dateValue) => {
										const newTags =
											getTagsArray(tagsString);
										const added = newTags.filter(
											t => !multiCommonTags.includes(t)
										);
										const removed = multiCommonTags.filter(
											t => !newTags.includes(t)
										);

										// Safely check dateValue using optional chaining (?.)
										if (
											added.length > 0 ||
											removed.length > 0 ||
											dateValue?.length === 8
										) {
											const keys =
												Array.from(selectedItems);
											const body = { keys };

											if (added.length > 0)
												body.addedTags = added;
											if (removed.length > 0)
												body.removedTags = removed;

											if (dateValue?.length === 8) {
												body.newDate = dateValue;
											}

											apiFetch("/bulk-update", {
												method: "POST",
												headers: {
													"Content-Type":
														"application/json"
												},
												body: JSON.stringify(body)
											}).then(res => {
												if (res.ok) {
													setMedia(prev =>
														prev.map(item => {
															if (
																keys.includes(
																	item.key
																)
															) {
																let current =
																	getTagsArray(
																		item.tags
																	);
																current =
																	current.filter(
																		t =>
																			!removed.includes(
																				t
																			)
																	);
																current = [
																	...new Set([
																		...current,
																		...added
																	])
																];
																return {
																	...item,
																	tags: current.join(
																		", "
																	),
																	created_date:
																		dateValue?.length ===
																			8
																			? dateValue
																			: item.created_date
																};
															}
															return item;
														})
													);

													// Deselect everything using the correct Set format
													setSelectedItems(new Set());
												}
											});
										}
									}}
									placeholder="Edit tags (common shown)..."
								/>
							</div>
						)}
					</div>
				)}

				{/* Gallery content */}
				<div
					style={{
						padding: "2px",
						maxWidth: "90%",
						margin: "0 auto"
					}}
				>
					{/* Full-screen modal */}
					{fullscreenItem && (
						<div
							style={{
								position: "fixed",
								top: 0,
								left: 0,
								width: "100dvw",
								height: "100DVH",
								background: "rgba(0,0,0,0.95)",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								zIndex: 1000
							}}
							onClick={closeFullscreen}
						>
							<div
								style={{
									position: "absolute",
									right: "2%",
									top: "2%",
									fontSize: "3em",
									color: "#fff",
									cursor: "pointer",
									zIndex: "10"
								}}
								onClick={closeFullscreen}
							>
								x
							</div>
							{media.findIndex(
								m => m.key === fullscreenItem.key
							) > 0 && (
									<div
										style={{
											position: "absolute",
											left: "2%",
											fontSize: "5em",
											color: "#fff",
											cursor: "pointer",
											zIndex: "10"
										}}
										onClick={e => {
											goPrev();
										}}
									>
										‹-
									</div>
								)}

							<div
								style={{ maxWidth: "100%", maxHeight: "100%" }}
							>
								{fullscreenItem.isVideo ? (
									hasAccessForDate(fullscreenItem?.date) ? (
										<video
											src={`${R2_PUBLIC_URL}/${fullscreenItem.key}`}
											controls
											autoPlay
											loop
											muted
											controlsList="nodownload"
											onContextMenu={e => {
												e.preventDefault();
												if (
													user?.username?.toLowerCase() ===
													"lunepusa"
												) {
													handleMediaShareCopy(
														fullscreenItem
													)(e);
												}
											}}
											style={{
												maxWidth: "100%",
												maxHeight: "100dvh",
												width: "auto",
												height: "auto",
												objectFit: "contain",
												background: "#000"
											}}
										/>
									) : (
										// Safe blurred fallback for unauthorized users on videos
										<img
											src={`${R2_PUBLIC_URL}/cdn-cgi/image/quality=85,format=auto,blur=50/${fullscreenItem.key.replace(/\.[^/.]+$/, "")}_thumb.jpg`}
											alt="Preview restricted"
											style={{
												maxWidth: "100%",
												maxHeight: "100dvh",
												width: "auto",
												height: "auto",
												objectFit: "contain",
												background: "#000"
											}}
										/>
									)
								) : (
									<img
										src={
											hasAccessForDate(
												fullscreenItem?.date
											)
												? `${R2_PUBLIC_URL}/${fullscreenItem.key}`
												: `${R2_PUBLIC_URL}/cdn-cgi/image/quality=85,format=auto,blur=200/${fullscreenItem.key}`
										}
										alt=""
										onContextMenu={e => {
											e.preventDefault();
											if (
												user?.username?.toLowerCase() ===
												"lunepusa"
											) {
												handleMediaShareCopy(
													fullscreenItem
												)(e);
											}
										}}
										style={{
											maxWidth: "100%",
											maxHeight: "100dvh",
											width: "auto",
											height: "auto",
											objectFit: "contain",
											background: "#000"
										}}
									/>
								)}
							</div>

							{media.findIndex(
								m => m.key === fullscreenItem.key
							) <
								media.length - 1 && (
									<div
										style={{
											position: "absolute",
											right: "2%",
											fontSize: "5em",
											color: "#fff",
											cursor: "pointer",
											zIndex: "10"
										}}
										onClick={e => {
											goNext();
										}}
									>
										-›
									</div>
								)}
						</div>
					)}

					{/* Date groups */}
					{sortedDates.map(date => {
						const { items, commonTags } = groups[date];
						const videoCount = items.filter(i => i.isVideo).length;
						const photoCount = items.length - videoCount;
						const caption = items[0]?.caption || "";

						const isFirstGroup = date === firstDate;

						return (
							<div
								key={date}
								style={{
									marginBottom: "5px",
									border: "1px dashed white"
								}}
							>
								<h3
									class="h4"
									style={{ textAlign: "center", maxWidth: "500px" }}
									onContextMenu={handleDateShareCopy(date)}

								>
									{editingGroupCaption === date ? (
										<div>
											<input
												value={tempCaption}
												onChange={e =>
													setTempCaption(
														e.target.value
													)
												}
												placeholder="Group caption"
												style={{
													width: "60%",
													fontSize: "1em"
												}}
											/>
											<button onClick={saveEdit}>
												Save
											</button>
											<button
												onClick={() =>
													setEditingGroupCaption(null)
												}
											>
												Cancel
											</button>
										</div>
									) : (
										<>
											{caption && `${caption} — `}
											{!!isAdmin && (
												<span
													style={{
														cursor: "pointer",
														fontSize: "0.8em"
													}}
													onClick={() => {
														setEditingGroupCaption(
															date
														);
														setTempCaption(caption);
													}}
												>
													✏️
												</span>
											)}
										</>
									)}
								</h3>

								<h4
									style={{
										textAlign: "center",
										fontSize: ".8em",
										verticalAlign: "baseline"
									}}
								>
									{date}
									{videoCount > 0 && ` — v${videoCount}`}
									{photoCount > 0 && ` p${photoCount}`}
								</h4>

								<div style={{ textAlign: "center" }}>
									{items
										.slice()
										.sort((a, b) => {
											const getTime = key => {
												const filename = key
													.split("/")
													.pop();
												const timePart =
													filename
														.split("_")[1]
														?.split(".")[0] ||
													"000000000";
												return timePart;
											};
											return getTime(b.key).localeCompare(
												getTime(a.key)
											);
										})
										.map(item => {
											const itemTags = getTagsArray(
												item.tags
											);

											return (
												<div
													key={item.key}
													style={{
														display: "inline-block",
														verticalAlign: "top",
														// MIN AND MAX HEIGHTS REMOVED FROM HERE
														margin: "0 3px 5px 3px", // Kept strictly to your original values
														cursor: "pointer",
														position: "relative",
														border:
															multiSelectMode &&
																selectedItems.has(
																	item.key
																)
																? "3px solid yellow"
																: "none"
													}}
												>
													{/* INNER MEDIA CONTAINER */}
													<div
														style={{
															display:
																"inline-block", // Reverted back to inline-block
															textAlign: "center", // Centers the image horizontally
															minHeight: "100px", // Heights moved to this container
															height: "150px",
															maxHeight: "20dvh",
															width: "fit-content",
															background: "#000",
															borderRadius:
																"12px",
															overflow: "hidden",
															position:
																"relative",
															border: "1px white solid"
														}}
														onClick={e => {
															if (
																multiSelectMode
															) {
																setSelectedItems(
																	prev => {
																		const next =
																			new Set(
																				prev
																			);
																		if (
																			next.has(
																				item.key
																			)
																		)
																			next.delete(
																				item.key
																			);
																		else
																			next.add(
																				item.key
																			);
																		return next;
																	}
																);
															} else {
																openFullscreen(
																	item
																);
															}
														}}
														onContextMenu={e => {
															e.preventDefault();
														}}
													>
														{(() => {
															const hasAccess =
																hasAccessForDate(
																	item.date ||
																	"Unknown"
																);

															let targetKey =
																item.key;
															if (item.isVideo) {
																targetKey =
																	item.key.replace(
																		/\.[^/.]+$/,
																		""
																	) +
																	"_thumb.jpg";
															}

															const cloudflareUrl =
																!hasAccess
																	? `${R2_PUBLIC_URL}/cdn-cgi/image/width=250,quality=80,format=auto,blur=20/${targetKey}`
																	: `${R2_PUBLIC_URL}/cdn-cgi/image/width=250,quality=80,format=auto/${targetKey}`;

															return (
																<>
																	<img
																		src={
																			cloudflareUrl
																		}
																		alt={
																			caption
																		}
																		style={{
																			height: "100%", // Forces image to match the containers 200px height
																			width: "auto",
																			objectFit:
																				"contain",
																			WebkitTouchCallout:
																				"none",
																			WebkitUserSelect:
																				"none"
																		}}
																	/>

																	{item.isVideo && (
																		<div
																			style={{
																				position:
																					"absolute",
																				top: "50%",
																				left: "50%",
																				transform:
																					"translate(-50%, -50%)",
																				background:
																					"rgba(0,0,0,0.5)",
																				borderRadius:
																					"50%",
																				height: "30%",
																				width: "auto",
																				aspectRatio:
																					"1/1",
																				pointerEvents:
																					"none"
																			}}
																		>
																			<span
																				style={{
																					position:
																						"absolute",
																					top: "50%",
																					left: "50%",
																					transform:
																						"translate(-50%, -50%)",
																					color: "#fff",
																					fontSize:
																						"1.2em"
																				}}
																			>
																				{hasAccess
																					? "▶"
																					: "🔒"}
																			</span>
																		</div>
																	)}
																</>
															);
														})()}
													</div>

													<br />

													{/* TAGS SECTION - untouched */}
													<div
														style={{
															textAlign: "center"
														}}
													>
														{editingItem ===
															item.key ? (
															<>
																<TagSelect
																	selected={
																		tempTags
																	}
																	onChange={
																		setTempTags
																	}
																/>
																<button
																	onClick={
																		saveEdit
																	}
																>
																	Save
																</button>
																<button
																	onClick={() => {
																		setEditingItem(
																			null
																		);
																		setTempTags(
																			[]
																		);
																		setOriginalTags(
																			[]
																		);
																	}}
																>
																	Cancel
																</button>
															</>
														) : (
															<div
																style={{
																	color: "#ccc"
																}}
															>
																{multiSelectMode ? (

																	<p style={{ margin: "2px 0", color: "#ccc", fontSize: "0.9em" }}>
																		Tags:<br /> {itemTags.length > 0 ? itemTags.join(", ") : "none"}
																	</p>
																) : (
																	// Normal view: Clickable tags safely tucked inside the Collapse component
																	<Collapse trigger={<p style={{ margin: "2px 0", cursor: "pointer" }}> Tags⏬</p>}>
																		<ClickableTags tags={item.tags} className="small" />
																	</Collapse>
																)}

																{!!isAdmin && (
																	<p
																		style={{
																			fontSize:
																				"0.5em",
																			color: "#ccc",
																			margin: "2px 0"
																		}}
																	></p>
																)}
															</div>
														)}
													</div>
												</div>
											);
										})}
								</div>
							</div>
						);
					})}

					{hasMoreRef.current && (
						<div ref={loadMoreButtonRef} style={{ width: "100%" }}>
							<button
								onClick={() =>
									loadMoreGroups(
										offsetRef.current,
										activeSearchQuery
									)
								}
								disabled={loadingRef.current}
								style={{
									display: "block",
									margin: "10px auto",
									padding: "2px 5px",
									fontSize: "1.1em"
								}}
							>
								{loadingRef.current ? "Loading..." : "Load More"}
							</button>
						</div>
					)}
				</div>
			</div>
		</>
	);
};

export default Gallery;
