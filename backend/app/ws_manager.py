from fastapi import WebSocket


class ConnectionManager:
    """In-memory WebSocket connection registry keyed by conversation_id."""

    def __init__(self):
        self.active: dict[str, list[WebSocket]] = {}

    async def connect(self, conv_id: str, ws: WebSocket) -> None:
        await ws.accept()
        self.active.setdefault(conv_id, []).append(ws)

    def disconnect(self, conv_id: str, ws: WebSocket) -> None:
        if conv_id in self.active:
            self.active[conv_id] = [w for w in self.active[conv_id] if w is not ws]
            if not self.active[conv_id]:
                del self.active[conv_id]

    async def broadcast(self, conv_id: str, data: dict) -> None:
        for ws in list(self.active.get(conv_id, [])):
            try:
                await ws.send_json(data)
            except Exception:
                self.disconnect(conv_id, ws)


manager = ConnectionManager()
