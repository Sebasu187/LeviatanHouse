# LeviatanHouse


A full-stack e-commerce website built for a local trading card game store, 
selling Pokémon, One Piece, and Riftbound products. Built with vanilla 
HTML/CSS/JavaScript on the frontend and Supabase (Postgres + Auth + Edge 
Functions) on the backend.

## Features
- Product catalog with filtering by game and category (singles, packs, accessories)
- Shopping cart with persistent state across pages (localStorage)
- Real payment processing via ePayco (Smart Checkout v2)
- Automatic inventory sync — stock updates in real time when a payment is confirmed, via a secure serverless webhook
- Customer accounts (Supabase Auth): profile, saved addresses, wishlist, order history
- Admin panel for managing orders and inventory
- Tournament announcements page (upcoming/past results)
- Fully responsive design

## Tech stack
- Frontend: HTML, CSS, JavaScript (no framework)
- Backend: Supabase (PostgreSQL, Auth, Edge Functions)
- Payments: ePayco
- Hosting: Vercel / Netlify
