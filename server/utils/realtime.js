const clientsByUserId = new Map();

export const addClient = (userId, res) => {
  const userKey = String(userId);
  const list = clientsByUserId.get(userKey) || new Set();
  list.add(res);
  clientsByUserId.set(userKey, list);
};

export const removeClient = (userId, res) => {
  const userKey = String(userId);
  const list = clientsByUserId.get(userKey);
  if (!list) return;
  list.delete(res);
  if (list.size === 0) clientsByUserId.delete(userKey);
};

export const sendToUser = (userId, event) => {
  const userKey = String(userId);
  const list = clientsByUserId.get(userKey);
  if (!list) return;
  const payload = `data: ${JSON.stringify(event)}\n\n`;
  for (const res of list) {
    try {
      res.write(payload);
    } catch {}
  }
};


