const searchIndex = [
  // Home page (/)
  {
    id: "home-portfolio",
    text: "Visit my portfolio",
    type: "Link",
    page: "Home",
    route: "/",
    link: "https://example.com",
  },
  {
    id: "home-github",
    text: "Check out my GitHub",
    type: "Link",
    page: "Home",
    route: "/",
    link: "https://github.com",
  },
  {
    id: "home-media",
    text: "See my media gallery",
    type: "Link",
    page: "Home",
    route: "/",
    link: "https://my-media-site.com",
  },
  {
    id: "home-portfolio-details",
    text: "Portfolio Details",
    type: "Section",
    page: "Home",
    route: "/",
  },
  {
    id: "home-about-me",
    text: "About Me",
    type: "Section",
    page: "Home",
    route: "/",
  },
  {
    id: "home-contact-info",
    text: "Contact Info",
    type: "Section",
    page: "Home",
    route: "/",
  },
  // Media page (/media)
  {
    id: "media-gallery",
    text: "Media item 1",
    type: "Link",
    page: "Media",
    route: "/media",
    link: "https://media-site.com/item1",
  },
  // Photos page (/photos)
  {
    id: "photos-collection",
    text: "My photo collection",
    type: "Section",
    page: "Photos",
    route: "/photos",
  },
  // Videos page (/videos)
  {
    id: "videos-collection",
    text: "My video collection",
    type: "Section",
    page: "Videos",
    route: "/videos",
  },
  // About page (/about)
  {
    id: "about-me",
    text: "About me",
    type: "Section",
    page: "About",
    route: "/about",
  },
];

export default searchIndex;
