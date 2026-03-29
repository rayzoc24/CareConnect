# CareConnect
A platform to connect all NGOs.

## Run With MongoDB Backend

1. Start MongoDB locally (default URI used by app):
	mongodb://127.0.0.1:27017/careconnect
2. Install dependencies:
	npm install
3. Create a .env file (optional, only if you want custom values):

SESSION_SECRET=your_session_secret
MONGODB_URI=mongodb://127.0.0.1:27017/careconnect
PORT=3000
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

4. Start server:
	npm start

The frontend is served by the Express server and uses API routes for auth, issues, donations, voting, de-voting, claim workflow, and ratings.

## Image Uploads (Cloudinary)

- Volunteers upload issue images through `POST /api/uploads/issue-image`.
- Backend uploads the file to Cloudinary and returns `imageUrl`.
- Issue creation stores `photoUrl` in MongoDB (URL), not base64 data.

## NGO Recommendation Scoring (Demo-Friendly)

`GET /api/issues/:id/recommended-ngos` now uses a simple weighted score:

- Category match: +60
- Location state match: +20
- Location district match: +12
- Location area match: +8
- NGO capacity tier (volunteers): +2 / +4 / +7 / +10

This keeps recommendations easy to explain in a hackathon demo:
"We rank NGOs using category fit, location fit, and capacity."
