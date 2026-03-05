## Packages
framer-motion | Smooth animations for message bubbles and page transitions
react-markdown | Rendering markdown from AI responses
remark-gfm | GitHub flavored markdown for tables and strikethrough

## Notes
Tailwind Config - extend fontFamily:
fontFamily: {
  display: ["var(--font-display)"],
  body: ["var(--font-body)"],
}
API expects POST /api/conversations/:id/messages to return SSE stream with `data: {"content": "..."}` and `data: {"done": true}`
