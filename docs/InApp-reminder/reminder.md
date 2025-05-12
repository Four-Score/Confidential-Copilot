# Reminders API & UI Integration Guide

This document explains the implementation of the reminders dropdown, including marking reminders as read, deleting reminders, and keeping the unread count in sync with the UI and database.

---

## Features

- **Fetch reminders** only once when the dropdown is opened.
- **Mark as read:** Updates the `read` column in the database and UI, and decreases the unread count.
- **Delete reminder:** Removes the reminder from the database and UI.
- **Unread count badge:** Shows the number of unread reminders on the bell icon, updating in real time as reminders are marked as read or deleted.

---

## API Endpoints

### 1. Mark Reminder as Read

**Path:** `/api/reminders/mark`  
**Method:** `POST`  
**Query:** `id` (reminder id)

**Example:**
```http
POST /api/reminders/mark?id=REMINDER_ID
```

**Handler:**
- Authenticates the user.
- Updates the `read` column to `true` for the specified reminder and user.

---

### 2. Delete Reminder

**Path:** `/api/reminders/[id]/delete`  
**Method:** `DELETE`

**Example:**
```http
DELETE /api/reminders/REMINDER_ID/delete
```

**Handler:**
- Authenticates the user.
- Deletes the reminder with the given `id` for the authenticated user.

**Handler Implementation:**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } } | { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params; // Await params!
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!id) {
      return NextResponse.json({ error: 'Missing reminder id' }, { status: 400 });
    }
    const { error } = await supabase
      .from('reminders')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to delete reminder' }, { status: 500 });
  }
}
```

---

### 3. Get Unread Reminders Count

**Path:** `/api/reminders/count`  
**Method:** `GET`

**Returns:**  
```json
{ "count": <number of unread reminders> }
```

---

## React Hook: `useUnreadRemindersCount`

**Location:** `src/hooks/ReminderCount.ts`

- Fetches the unread reminders count when the dropdown is opened.
- Provides `count`, `fetchCount`, and `setCount` for UI updates.

---

## RemindersDropdown Component

- Fetches reminders once when opened.
- Shows each reminder with details.
- Shows a "Mark as read" button for unread reminders.
- Shows a ❌ (cross) button to delete any reminder.
- Updates UI and unread count on actions.

**Key Functions:**
- `markAsRead(id)`: Marks reminder as read in DB and UI, updates count.
- `deleteReminder(id)`: Deletes reminder in DB and UI, updates count.

---

## Error Handling

- All API routes check for authentication and required parameters.
- Proper error messages and status codes are returned for missing/invalid data.

---

## Notes

- The `[id]/delete` API route must use `const { id } = await params;` to comply with Next.js dynamic route requirements.
- The reminders list and count are kept in sync with the backend using the provided API endpoints and React state.

---

## References

- [Next.js Dynamic Route API Docs](https://nextjs.org/docs/app/building-your-application/routing/router-handlers#dynamic-route-handlers)
- [Supabase JS Client Docs](https://supabase.com/docs/reference/javascript/introduction)

---