import asyncio
import aiohttp

async def handle_echo(reader, writer):
    while True:
        data = await reader.read(100)
        message = data.decode()
        print()
        if message == "quit":
            break
        params={'km':message}
        async with aiohttp.ClientSession() as session:
            async with session.get("http://127.0.0.1:8090/line/km/add",params=params) as resp:
                resp_status=resp.status
                resp_text=await resp.text()

        addr = writer.get_extra_info('peername')
        #print(f"Received {message!r} from {addr!r}")
        #print(f"Send: {message!r}")
        writer.write(resp_text.encode("UTF-8"))
        await writer.drain()

    print("Close the connection")
    writer.close()


async def socket_server(app):
    loop = asyncio.get_event_loop()
    server = await asyncio.start_server(handle_echo, '0.0.0.0', 55535, loop=loop)

    addr = server.sockets[0].getsockname()
    print(f'Serving on {addr}')

    async with server:
        await server.serve_forever()
