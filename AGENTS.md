# AGENTS.md — Project Instructions

You are working on the "Online Farm Produce Platform" in `/opt/lampp/htdocs/winnie`.
Follow these project rules alongside any higher-priority system/developer instructions.

## Project Overview
- Frontend: plain HTML, CSS, JavaScript (no frameworks)
- Backend: PHP (REST-style endpoints)
- Database: MySQL on XAMPP
- Currency: Kenyan Shillings (KES)
- Payments: UI icons only (no payment processing)
- Background: animated dotted surface (canvas), adaptive, non-interactive

## Source of Truth
- Use the JSON brief provided by the user as authoritative for features, pages, and API endpoints.
- If a requirement is ambiguous, propose a sensible default and call it out in your response.

## Frontend Rules
- Build a fully responsive UI for all listed pages.
- Include the animated dotted background on the landing page and any other pages where it makes sense.
- Provide a theme toggle (light/dark) and ensure the canvas adapts to the theme.
- Payment icons must appear only on checkout and order pages; no click actions.
- Prices are displayed in KES with two decimals.

## Backend Rules (PHP)
- Use simple REST-style endpoints under `/api/`.
- Validate input server-side (email format, password length, price/quantity constraints).
- Enforce role-based access for farmer/buyer/admin actions.
- Return JSON with `success` and `message` fields for actions, and structured data for list endpoints.
- Use sessions for login state.

## Database Rules
- Database name: `farmproduce`
- Tables: `users`, `products`, `orders`, `order_items` per the brief.
- Use foreign keys where specified.

## Files & Conventions
- Keep filenames and routes exactly as specified in the brief.
- Keep code in ASCII unless the file already uses Unicode.
- Add short, meaningful comments only when code is non-obvious.

## Testing & Validation
- If you add or modify backend logic, include a minimal manual test checklist in your response.
- Do not implement payment processing.

## Deployment Notes
- Preserve or regenerate `deployment.txt` with the provided steps if requested.
- Assume XAMPP on Windows, but keep paths flexible.
