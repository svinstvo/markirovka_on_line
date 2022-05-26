import asyncio
import imp

import socket


async def run_server(app):
    return None


async def print_codes(app):
    try:
        while True:
            print('printing')
            await asyncio.sleep(3)
    except asyncio.CancelledError:
        print('job canceled')


async def before_print(app):
    app['printer']['connection'].send(b"\x1b\x02\x20\x01\x00\x00\x01\x02\x00\x00\x00\x00\x1b\x03")  # set print mode
    await asyncio.sleep(1)
    app['printer']['connection'].send(b"\x1b\x02\x11\x1b\x03")  # start print
    print('before_print')
    return


async def after_print(app):
    print('after print')
    app['printer']['connection'].send(b"\x1b\x02\x12\x1b\x03")  # stop print

    return


async def set_print_mode(app):
    print(app['printer']['printing'])
    if app['printer']['printing'] == 1:
        app['printer']['connection'] = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        app['printer']['connection'].connect((app['printer']['printer_ip'], app['printer']['printer_port']))
        await before_print(app)
        app['printer']['print_task'] = asyncio.create_task(print_codes(app))

    else:
        app['printer']['print_task'].cancel()
        await after_print(app)
        app['printer']['connection'].close()
    return
