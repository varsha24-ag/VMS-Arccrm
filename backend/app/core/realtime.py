import asyncio
import json
from typing import AsyncGenerator, Dict, Set

SubscriberQueue = asyncio.Queue[Dict[str, object]]

_subscribers: Set[SubscriberQueue] = set()


async def publish_event(event: Dict[str, object]) -> None:
    if not _subscribers:
        return
    for queue in list(_subscribers):
        await queue.put(event)


async def event_stream(user_id: int | None = None) -> AsyncGenerator[str, None]:
    queue: SubscriberQueue = asyncio.Queue()
    _subscribers.add(queue)
    try:
        while True:
            event = await queue.get()
            target_user_ids = event.get("target_user_ids")
            if isinstance(target_user_ids, list) and user_id is not None:
                if user_id not in target_user_ids:
                    continue
            yield f"data: {json.dumps(event)}\n\n"
    finally:
        _subscribers.discard(queue)
