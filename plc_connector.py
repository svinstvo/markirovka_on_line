import asyncio
import aiohttp


async def handle_km(reader, writer):
    print(writer)
    while True:
        data = await reader.read(100)
        message = data.decode()
        print(f"->{message}<-")
        if message == "quit":
            print("exit loop")
            await writer.drain()
            break
        params = {'km': message}
        async with aiohttp.ClientSession() as session:
            async with session.get("http://127.0.0.1:8090/line/km/add", params=params) as resp:
                resp_status = resp.status
                resp_text = await resp.text()

        addr = writer.get_extra_info('peername')
        # print(f"Received {message!r} from {addr!r}")
        # print(f"Send: {message!r}")
        writer.write(resp_text.encode("UTF-8"))
        await writer.drain()

    print("Close the connection")
    writer.close()
    await writer.wait_closed()
    print(writer.is_closing())


async def start_servers(app):
    loop = asyncio.get_event_loop()
    server_km = await asyncio.start_server(handle_km, '0.0.0.0', 2000, loop=loop)
    addr = server_km.sockets[0].getsockname()
    print(f'server for data from scanners run  on {addr}')

    server_echo = await asyncio.start_server(handle_km, '0.0.0.0', 2001, loop=loop, start_serving=True)

    # async with server:
    #    await server.serve_forever()
