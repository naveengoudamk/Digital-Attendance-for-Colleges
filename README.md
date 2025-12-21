# AttendEase - Attendance Management System

A web-based attendance management system built with **Spring Boot (Java)** and **Vanilla HTML/CSS/JS**.

## Features
- **User Authentication**: Role-based access for Faculty, Students, and Admin.
- **Session Management**: Faculty creates sessions with Geo-tagging.
- **QR Code Attendance**: Dynamic QR generation.
- **Multi-Factor Validation**: Checks QR Token + Geolocation Distance (< 50m) + One-time entry.
- **Premium UI**: Glassmorphism design with dark mode.

## Prerequisites
- Java 17+ (Java 21/23 recommended)
- Maven 3.x

## How to Run
1. Open a terminal in the project root.
2. Run the application:
   ```bash
   mvn spring-boot:run
   ```
3. Open your browser and navigate to:
   [http://localhost:8080](http://localhost:8080)

## Demo Credentials
| Role | Username | Password |
|------|----------|----------|
| Faculty | `faculty@test.com` | `password` |
| Student | `student@test.com` | `password` |
| Admin | `admin@test.com` | `admin` |

## How to Use
1. **Faculty**: Login -> Allow Location -> Start Session. A QR code is generated.
2. **Student**: Login (in a separate tab or device) -> Allow Location -> Click "Scan QR" (or enter Session ID manually for testing) -> Attendance Marked.

## Project Structure
- `src/main/java`: Spring Boot Backend (Controllers, Services, Models).
- `src/main/resources/static`: Frontend (HTML, CSS, JS).
- `pom.xml`: Project dependencies.
