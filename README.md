# Vast

A powerful Raycast extension for managing your Canvas LMS courses, assignments, and files directly from your Mac. Vast provides a unified interface to view your course materials, track assignments, download files, and organize everything in a structured directory system.

## Features

### Course Management
- **View All Courses**: Browse all your active Canvas courses organized by enrollment term
- **Course Details**: Access detailed information about each course including assignments, grades, and course materials
- **Custom Organization**: Customize term names and course directory names to match your preferred organization system
- **Quick Access**: Open courses directly in Canvas or navigate to course directories in Finder

### Assignment Feed
- **Unified Feed**: View all upcoming assignments, quizzes, exams, calendar events, and announcements in one place
- **Smart Categorization**: Automatically categorizes items as assignments, quizzes, exams, announcements, or calendar events
- **Date Grouping**: Items are organized by due date with clear section headers (Today, Tomorrow, This Week, etc.)
- **Status Indicators**: Visual indicators show submission status, overdue items, and upcoming deadlines
- **Submission Tracking**: See submission status, scores, and grading information at a glance

### Assignment Details
- **Full Descriptions**: View complete assignment descriptions with HTML content converted to readable Markdown
- **Rich Metadata**: See due dates, points possible, submission types, submission status, scores, and grading information
- **File Downloads**: Download all files attached to assignments with a single click
- **Selective Downloads**: Download individual files from assignment descriptions
- **Directory Management**: Automatically create and open assignment directories in Finder

### File Management
- **Automatic Organization**: Files are organized in a structured directory hierarchy:
  ```
  Base Directory/
    └── Term Name/
        └── Course Name/
            └── Assignment Name/
                └── [Downloaded Files]
  ```
- **Smart File Handling**: Automatically handles duplicate filenames by appending numbers
- **Batch Downloads**: Download all files from an assignment description at once
- **File Extraction**: Automatically extracts file links from HTML assignment descriptions

### Directory Setup
- **One-Time Setup**: Configure your directory structure once and reuse it for all courses
- **Term Organization**: Group courses by enrollment term with customizable term names
- **Custom Directory Names**: Customize how course directories are named
- **Configuration Persistence**: Your setup preferences are saved for future use
- **Native Folder Picker**: Use macOS native folder picker to select your base directory

## Installation

1. **Install Raycast** (if you haven't already):
   - Download from [raycast.com](https://raycast.com)
   - Install and set up Raycast on your Mac

2. **Install the Extension**:
   - Open Raycast
   - Go to Extensions → Browse Extensions
   - Search for "Vast" or install from the Raycast Store
   - Alternatively, clone this repository and run `npm install && npm run dev`

3. **Configure Canvas API**:
   - Log in to your Canvas instance
   - Navigate to **Account → Settings → Approved Integrations**
   - Click **+ New Access Token**
   - Give it a name (e.g., "Raycast Vast")
   - Copy the generated token (you won't be able to see it again!)

4. **Set Up Preferences**:
   - Open Raycast and run the **Setup Vast** command
   - Enter your Canvas Base URL (e.g., `https://your-school.instructure.com`)
   - Enter your Canvas API Token
   - Choose or enter your Vast Base Directory (where course folders will be created)

## Usage

### Initial Setup

#### Step 1: Configure Canvas Connection
1. Run the **Setup Vast** command from Raycast
2. If Canvas is not configured, you'll see the Canvas Setup form
3. Enter your **Canvas Base URL**:
   - This is your Canvas instance URL (e.g., `https://canvas.instructure.com` or `https://your-school.instructure.com`)
   - Do not include a trailing slash
4. Enter your **Canvas API Token**:
   - The token you generated in the Installation step
5. Click **Save Configuration**

#### Step 2: Configure Directory Structure
1. After Canvas is configured, you'll see the Vast Setup form
2. **Choose Base Directory**:
   - Press `⌘+K` while the Base Directory field is focused
   - Select **"Choose Folder…"** to use the native folder picker
   - Or manually enter the full path (e.g., `/Users/username/Documents/Vast`)
   - **Note**: The folder picker requires Accessibility permission in System Settings → Privacy & Security → Accessibility
3. **Customize Term Names**:
   - For each term, enter a descriptive name (e.g., "Fall 2024", "Spring 2025")
   - This will be used as the folder name for that term
4. **Customize Course Directory Names** (optional):
   - By default, course directories use the format: `[Course Code] - [Course Name]`
   - You can customize each course directory name to your preference
   - For example: "CS101" instead of "CS 101 - Introduction to Computer Science"
5. Click **Setup Vast Directories** to create the directory structure

### Viewing Courses

1. Run the **View Courses** command from Raycast
2. Courses are automatically grouped by enrollment term
3. Each course shows:
   - Course code and name
   - Course icon
4. **Actions available**:
   - Press `Enter` to view course details and assignments
   - Press `⌘+O` to open the course in Canvas
   - Press `⌘+Shift+O` to open the course directory in Finder (if configured)
   - Press `⌘+R` to refresh the course list

### Using the Assignment Feed

1. Run the **Canvas Feed** command from Raycast
2. The feed shows all upcoming items grouped by date:
   - **Today**: Items due today
   - **Tomorrow**: Items due tomorrow
   - **This Week**: Items due this week
   - **Next Week**: Items due next week
   - **Later**: Items due in the future
   - **Unscheduled**: Items without due dates
3. Each item shows:
   - Title and course name
   - Due date and time
   - Points possible (if applicable)
   - Submission status (submitted, not submitted, graded)
   - Visual indicators (checkmark for submitted, exclamation for due soon, X for overdue)
4. **Actions available**:
   - Press `Enter` to view assignment details
   - Press `⌘+O` to open the assignment in Canvas
   - Press `⌘+R` to refresh the feed
5. **Search**: Use the search bar to filter assignments by title or course name

### Viewing Assignment Details

1. From the Assignment Feed or Course view, select an assignment and press `Enter`
2. The detail view shows:
   - **Full Description**: Complete assignment description with formatting
   - **Metadata**:
     - Due date
     - Points possible
     - Submission types
     - Submission status
     - Submitted date (if submitted)
     - Score (if graded)
     - Graded date (if graded)
3. **Actions available**:
   - Press `⌘+O` to open the assignment in Canvas
   - Press `⌘+D` to download all files from the assignment (if files are available)
   - Press `⌘+Shift+O` to open the course directory in Finder
   - Press `⌘+Shift+A` to create and open the assignment directory in Finder
   - Press `⌘+R` to refresh assignment details
4. **File Downloads**:
   - If the assignment description contains files, you'll see download options
   - **Download All Files**: Downloads all files to the assignment directory
   - **Download Individual Files**: Download specific files one at a time
   - Files are automatically saved to: `Base Directory/Term Name/Course Name/Assignment Name/`

### Managing Course Assignments

1. From the **View Courses** command, select a course and press `Enter`
2. Assignments are organized into sections:
   - **Active**: Assignments that are not yet due
   - **Submitted**: Assignments you've submitted
   - **Past Due**: Assignments that are past their due date
3. Each assignment shows:
   - Title and due date
   - Points possible
   - Submission status
   - Score (if graded)
4. **Actions available**:
   - Press `Enter` to view assignment details
   - Press `⌘+O` to open the course in Canvas
   - Press `⌘+Shift+O` to open the course directory in Finder
   - Press `⌘+R` to refresh assignments

## Keyboard Shortcuts

### Global Shortcuts
- `⌘+R`: Refresh current view
- `⌘+O`: Open in Canvas browser
- `⌘+Shift+O`: Open course directory in Finder
- `⌘+Shift+A`: Create and open assignment directory in Finder
- `⌘+D`: Download all files from assignment

### Setup Shortcuts
- `⌘+K`: Show action panel (for folder picker and other actions)

## Directory Structure

Vast creates a structured directory hierarchy for organizing your course materials:

```
Base Directory/
├── Fall 2024/
│   ├── CS 101 - Introduction to Computer Science/
│   │   ├── Assignment 1 - Hello World/
│   │   │   └── [Downloaded files]
│   │   ├── Assignment 2 - Variables/
│   │   │   └── [Downloaded files]
│   │   └── ...
│   └── MATH 201 - Calculus I/
│       └── ...
└── Spring 2025/
    └── ...
```

- **Base Directory**: The root directory you specify in preferences
- **Term Directories**: Named according to your term names (e.g., "Fall 2024")
- **Course Directories**: Named according to your course directory names
- **Assignment Directories**: Automatically created when you download files or open assignment directories

## Configuration

### Preferences

Access preferences by:
1. Opening Raycast
2. Going to **Raycast → Extensions → Vast → Preferences**
3. Or running any Vast command and pressing `⌘+,`

**Available Preferences**:
- **Canvas Base URL**: Your Canvas instance URL
- **Canvas API Token**: Your personal Canvas API token
- **Vast Base Directory**: Base directory for course folders

### Vast Configuration File

Vast saves a configuration file (`.vast-config.json`) in your base directory that stores:
- Custom term names
- Custom course directory names

This allows you to:
- Reuse your setup across multiple sessions
- Maintain consistency in directory naming
- Easily update directory names without recreating the structure

## Troubleshooting

### Canvas API Errors

**"Invalid API token"**:
- Verify your API token is correct in preferences
- Generate a new token from Canvas if needed
- Ensure the token hasn't expired

**"Access forbidden"**:
- Check that your API token has the necessary permissions
- Some Canvas instances may restrict API access

**"Canvas API error"**:
- Verify your Canvas Base URL is correct
- Ensure you're using the correct Canvas instance URL
- Check your internet connection

### Directory Issues

**"Vast base directory not configured"**:
- Run the **Setup Vast** command
- Configure your base directory in preferences or the setup form

**"Course directory does not exist"**:
- Run the **Setup Vast** command to create course directories
- Ensure you've completed the directory setup process

**"Failed to create directory"**:
- Check that you have write permissions for the base directory
- Ensure the path is valid and accessible
- Try using a different base directory location

### Folder Picker Issues

**"Accessibility permission required"**:
- Go to **System Settings → Privacy & Security → Accessibility**
- Enable Raycast in the list
- Restart Raycast if needed

**Folder picker closes Raycast**:
- This is expected behavior on macOS
- Your selected folder will be saved automatically
- Simply reopen the command to continue

### File Download Issues

**"No files found in assignment description"**:
- The assignment may not have files attached
- Files may be embedded in a different format
- Try opening the assignment in Canvas to verify files exist

**"Download failed"**:
- Check your internet connection
- Verify you have write permissions for the assignment directory
- Ensure the course directory exists (run Setup Vast if needed)

## Requirements

- **macOS**: 10.15 or later
- **Raycast**: Latest version
- **Canvas LMS**: Any Canvas instance with API access enabled
- **Canvas API Token**: Personal access token with appropriate permissions

## Privacy & Security

- **API Token Storage**: Your Canvas API token is stored securely in Raycast's encrypted preferences
- **Local Storage**: All course data and files are stored locally on your Mac
- **No Cloud Sync**: Vast does not sync data to any cloud services
- **API Access**: Vast only accesses Canvas data that you have permission to view

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see LICENSE file for details

## Support

For issues, questions, or feature requests, please open an issue on the GitHub repository.

---

**Made with ❤️ for Canvas LMS users**
