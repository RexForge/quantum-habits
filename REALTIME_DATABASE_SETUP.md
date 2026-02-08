# Firebase Realtime Database Setup Guide

This guide will walk you through setting up Firebase Realtime Database for your Quantum Habits app.

## Step 1: Create Realtime Database in Firebase Console

1. **Go to Firebase Console**
   - Visit: https://console.firebase.google.com/
   - Select your project: `quantumhabits`

2. **Create Realtime Database**
   - In the left sidebar, click on **"Realtime Database"**
   - Click **"Create Database"** button
   - Choose a location (select the closest region to your users)
   - Choose **"Start in test mode"** for now (we'll configure security rules next)
   - Click **"Enable"**

3. **Get Your Database URL**
   - After creating the database, you'll see the database URL at the top
   - It will look like: `https://quantumhabits-default-rtdb.firebaseio.com` or `https://quantumhabits-default-rtdb-REGION.firebaseio.com`
   - **Copy this URL** - you'll need it in the next step

## Step 2: Update Your Code with Database URL

1. **Open `src/lib/firebase.js`**
   - Find the line: `databaseURL: "https://quantumhabits-default-rtdb.firebaseio.com"`
   - Replace it with your actual database URL from Step 1

## Step 3: Configure Security Rules

1. **Go to Realtime Database Rules**
   - In Firebase Console, click on **"Realtime Database"**
   - Click on the **"Rules"** tab

2. **Replace the Rules**
   - Copy and paste the following security rules:

```json
{
  "rules": {
    "posts": {
      ".read": "auth != null",
      ".write": "auth != null",
      "$postId": {
        ".validate": "newData.hasChildren(['userId', 'content', 'timestamp']) && newData.child('userId').val() == auth.uid"
      },
      "$postId": {
        "comments": {
          ".read": "auth != null",
          ".write": "auth != null",
          "$commentId": {
            ".validate": "newData.hasChildren(['userId', 'text', 'createdAt']) && newData.child('userId').val() == auth.uid"
          }
        }
      }
    },
    "users": {
      "$uid": {
        ".read": "auth != null",
        ".write": "$uid === auth.uid"
      }
    },
    "userHabits": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid"
      }
    }
  }
}
```

3. **Publish the Rules**
   - Click **"Publish"** button
   - Rules are now active

## Step 4: Understanding the Security Rules

### Posts Collection
- **Read**: Any authenticated user can read posts
- **Write**: Any authenticated user can create posts
- **Validation**: Users can only create posts with their own `userId`

### Comments (Nested under Posts)
- **Read/Write**: Any authenticated user
- **Validation**: Users can only create comments with their own `userId`

### Users Collection
- **Read**: Any authenticated user can read user profiles
- **Write**: Users can only write to their own profile (`$uid === auth.uid`)

### User Habits Collection
- **Read/Write**: Users can only access their own habits data

## Step 5: Test Your Setup

1. **Run Your App**
   ```bash
   npm run dev
   ```

2. **Test Post Creation**
   - Log in to your app
   - Try creating a post
   - Check Firebase Console → Realtime Database → Data tab
   - You should see your post appear under `/posts/`

3. **Verify Data Structure**
   Your database should have this structure:
   ```
   posts/
     {postId}/
       userId: "user123"
       content: "My post content"
       timestamp: 1234567890
       likes: 0
       comments: 0
       comments/
         {commentId}/
           userId: "user123"
           text: "Comment text"
           createdAt: 1234567890
   
   users/
     {userId}/
       name: "User Name"
       avatar: "url"
       lastSeen: 1234567890
   
   userHabits/
     {userId}/
       habits: [...]
       lastUpdated: "2024-01-01T00:00:00.000Z"
   ```

## Step 6: Database Indexes (Optional)

Realtime Database automatically indexes data, but for better performance with large datasets:

1. **Go to Database → Indexes tab**
2. **Add Indexes** (if needed for complex queries):
   - For posts by timestamp: `posts` → `timestamp`
   - For posts by userId: `posts` → `userId`
   - For posts by type: `posts` → `type`

## Troubleshooting

### Error: "Permission denied"
- **Solution**: Check your security rules in Firebase Console
- Make sure rules are published
- Verify user is authenticated

### Error: "Database URL not found"
- **Solution**: Update `databaseURL` in `src/lib/firebase.js` with your actual database URL

### Error: "Cannot read property 'val' of undefined"
- **Solution**: Check if data exists before calling `.val()`:
  ```javascript
  if (snapshot.exists()) {
    const data = snapshot.val();
  }
  ```

### Posts not appearing
- **Solution**: 
  1. Check browser console for errors
  2. Verify database URL is correct
  3. Check security rules allow reads
  4. Verify user is authenticated

## Production Considerations

1. **Update Security Rules for Production**
   - Review and tighten rules based on your needs
   - Consider rate limiting
   - Add validation for data types and sizes

2. **Enable Database Backups**
   - Go to Database → Backups
   - Set up automated backups

3. **Monitor Usage**
   - Check Database → Usage tab
   - Set up alerts for quota limits

## Key Differences from Firestore

| Feature | Firestore | Realtime Database |
|---------|-----------|-------------------|
| Data Structure | Documents/Collections | JSON Tree |
| Queries | Complex queries with indexes | Simple queries, automatic indexing |
| Timestamps | `serverTimestamp()` → Timestamp object | `Date.now()` → Number (milliseconds) |
| Offline | Requires setup | Enabled by default |
| Real-time | `onSnapshot()` | `onValue()` |
| Write | `addDoc()`, `setDoc()` | `push()`, `set()` |
| Update | `updateDoc()` | `update()` |
| Delete | `deleteDoc()` | `remove()` |

## Next Steps

1. ✅ Create Realtime Database
2. ✅ Update `databaseURL` in code
3. ✅ Configure security rules
4. ✅ Test post creation
5. ✅ Verify data appears in Firebase Console

Your app is now configured to use Firebase Realtime Database!

