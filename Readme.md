# Trekking Chatbot – Startup Village Club

A comprehensive web-based application with authentication system and trekking member search functionality.

## Features

### Authentication System
- **User Registration**: Secure signup with email verification and password validation
- **User Login**: Email and password authentication
- **Password Recovery**: Forgot password functionality with email verification
- **Session Management**: Automatic login state management
- **Logout**: Secure logout functionality

### Member Search
- Search trekking members by User ID (101–130)
- Displays comprehensive member details including:
  - Name, age, and date of birth
  - Place of residence
  - Trekking experience
  - Preferred camp locations
  - Contact information (email and phone)

### User Interface
- Modern, responsive design with camping theme
- Blurred background with transparent elements
- Smooth animations and transitions
- User-friendly navigation between pages
- Real-time form validation

## File Structure

```
├── index.html              # Landing page with login/signup options
├── login.html              # User authentication page
├── signup.html             # User registration page
├── forgot-password.html    # Password recovery page
├── dashboard.html          # Main application with member search
├── camping-bg.jpg          # Background image
├── UserData.csv            # Member data in CSV format
├── UserData.json           # Member data in JSON format
├── convert_csv_to_json.py  # Utility script for data conversion
└── Readme.md               # This documentation
```

## How to Run

1. **Download all files** to a local directory
2. **Open `index.html`** in any modern web browser
3. **Create an account** using the signup page
4. **Login** with your credentials
5. **Search for members** by entering User IDs (101-130)

## Security Features

- **Password Requirements**: Minimum 8 characters with uppercase, lowercase, number, and special character
- **Email Validation**: Proper email format verification
- **Phone Validation**: 10-digit phone number validation
- **Session Management**: Automatic login state tracking
- **Data Persistence**: User data stored in browser localStorage

## Browser Compatibility

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Development

The application uses:
- **HTML5** for structure
- **CSS3** for styling and animations
- **JavaScript** for functionality and data management
- **localStorage** for client-side data persistence

---

**Developed by:** Tejaswini D

