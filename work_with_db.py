import asyncio


async def save_into_db(request, km, gtin, batch_date):
    pool = request.app['local_server']
    local_db_table_name = f"line_{request.app['markstation_id']}"
    async with pool.acquire() as connection:
        async with connection.transaction():
            result = await connection.fetch(
                f'insert into {local_db_table_name} (km,gtin,batch_date) values ($1,$2,$3)', km, gtin, batch_date)
            print(result)


async def load_counters_from_db(app, loop):
    time_between_reload_stat = app['time_between_reload_stat']
    pool = app['local_server']
    table_name = f"line_{app['markstation_id']}"
    while True:
        try:
            if app['current_gtin'] != "" and app["current_batch_date"] != "":
                async with pool.acquire() as connection:
                    async with connection.transaction():
                        result = await connection.fetchrow(f'''select n1.good,n2.defect,n3.total from
    (select count(gtin) good from {table_name} where batch_date=$1 and gtin=$2 and km!='') as n1 ,
    (select count(gtin) defect from {table_name} where batch_date=$1 and gtin=$2 and km ='') as n2,
    (select count(gtin) total from {table_name} where batch_date=$1 and gtin=$2) as n3;''',
                                                           app["current_batch_date"], app['current_gtin'])
                        print(result)
                        json = {"good_codes": result['good'], "defect_codes": result['defect'],
                                "total_codes": result['total']}
                        app['counters'] = json
                if not loop:
                    return
            if not loop:
                return
        except Exception as e:
            print(e)
        await asyncio.sleep(time_between_reload_stat)


async def load_settings_from_db(app):
    pool = app['local_server']
    table_name = f"settings_line_{app['markstation_id']}"
    async with pool.acquire() as connection:
        async with connection.transaction():
            record = await connection.fetchrow(
                f''' select time_brak_no_read,time_brak_no_zazor,time_impulse,time_imp_upakov,zadanie_count_brak from settings_line_1;''')
            result = {}
            for key in record.keys():
                result[key] = record[key]
    return result


async def get_available_procutc_list(app):
    pool = app['local_server']
    table_name = "available_products "

    async with pool.acquire() as connection:
        async with connection.transaction():
            record = await connection.fetch('select gtin,name from available_products where line = $1;',
                                            app['markstation_id'])

    result = {}
    for line in record:
        print(line[0])
        print(line[1])
        result[line[0]] = line[1]

    return result
