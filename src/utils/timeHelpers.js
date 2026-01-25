export const toDateStr = (d) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatTime = (date, use12 = false) => {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: use12,
  });
};

export const formatTime12Hour = (time24) => {
  const [h, m] = time24.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hh = h % 12 || 12;
  return `${hh}:${String(m).padStart(2, '0')} ${period}`;
};

export const formatDate = (d) =>
  d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    weekday: 'long',
  });

export const getTasksForDate = (tasks, date) => {
  const ds = toDateStr(date);
  return tasks.filter((t) => (t.date || toDateStr(new Date())) === ds);
};

export const getTaskStatus = (task, currentTime) => {
  if (task.completed) return 'completed';
  const now = currentTime;
  const nowM = now.getHours() * 60 + now.getMinutes();
  const [sh, sm] = task.startTime.split(':').map(Number);
  const [eh, em] = task.endTime.split(':').map(Number);
  const startM = sh * 60 + sm;
  const endM = eh * 60 + em;
  if (nowM >= startM && nowM < endM) return 'current';
  if (nowM < startM) return 'upcoming';
  return 'past';
};

export const getCurrentActiveTask = (tasks, currentTime) => {
  const nowM = currentTime.getHours() * 60 + currentTime.getMinutes();
  return tasks.find((task) => {
    const [sh, sm] = task.startTime.split(':').map(Number);
    const [eh, em] = task.endTime.split(':').map(Number);
    const startM = sh * 60 + sm;
    const endM = eh * 60 + em;
    return nowM >= startM && nowM < endM && !task.completed;
  });
};

export const getRemainingTime = (task, currentTime) => {
  if (!task) return 0;
  const nowM = currentTime.getHours() * 60 + currentTime.getMinutes();
  const [eh, em] = task.endTime.split(':').map(Number);
  const endM = eh * 60 + em;
  return Math.max(0, endM - nowM);
};

export const getTaskProgress = (task, currentTime) => {
  if (!task) return 0;
  const remainingMinutes = getRemainingTime(task, currentTime);
  return ((task.duration - remainingMinutes) / task.duration) * 100;
};

export const timeToAngle = (time, is12 = false) => {
  const [h, m] = time.split(':').map(Number);
  if (is12) {
    const hh = h % 12 || 12;
    return hh * 30 + (m / 60) * 30 - 90;
  }
  return h * 15 + (m / 60) * 15 - 90;
};

export const getCurrentTimeAngle = (currentTime, is12 = false) => {
  const h = currentTime.getHours();
  const m = currentTime.getMinutes();
  if (is12) {
    const hh = h % 12 || 12;
    return hh * 30 + (m / 60) * 30 - 90;
  }
  return h * 15 + (m / 60) * 15 - 90;
};
