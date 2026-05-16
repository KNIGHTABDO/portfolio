export const social = [
  { url: "mailto:knight007youtu@gmail.com", name: "mail" },
  { url: "https://github.com/knightabdo", name: "github" },
  { url: "https://www.linkedin.com/in/abdessamad-aabida-b6aa55302", name: "linkedin" },
  { url: "https://x.com/jip7e", name: "x" },
] as const satisfies { url: string; name: "mail" | "github" | "instagram" | "linkedin" | "x" }[];
