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


async def event_stream() -> AsyncGenerator[str, None]:
    queue: SubscriberQueue = asyncio.Queue()
    _subscribers.add(queue)
    try:
        while True:
            event = await queue.get()
            yield f"data: {json.dumps(event)}\n\n"
    finally:
        _subscribers.discard(queue)
