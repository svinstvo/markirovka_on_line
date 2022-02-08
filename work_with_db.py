import asyncio


async def save_into_db(app, cod_gp,gtin, tail, crypto_tail, batch_date, status):
    pool = app['local_server']
    markstation_id = app['markstation_id']
    async with pool.acquire() as connection:
        async with connection.transaction():
            result = await connection.fetch(
                f'insert into marking.line (cod_gp,gtin, tail, crypto_tail, batch_date,verified_status,line) values ($1,$2,$3,$4,$5,$6,$7)',
                cod_gp,gtin, tail, crypto_tail, batch_date, status, markstation_id)
            # print(result)


async def load_counters_from_db(app, loop):
    time_between_reload_stat = app['time_between_reload_stat']
    pool = app['local_server']
    markstation_id = app['markstation_id']
    while True:
        try:
            #if app['current_gtin'] != "" and app["current_batch_date"] != "":
            if app['current_cod_gp'] != "" and app["current_batch_date"] != "":
                async with pool.acquire() as connection:
                    async with connection.transaction():
                        result = await connection.fetchrow(f'''select n1.good,n2.defect,n3.total,n4.duplicate from
    (select count(gtin) good from marking.line where batch_date=$1 and cod_gp=$2 and verified_status like 'verified') as n1 ,
    (select count(gtin) defect from marking.line where batch_date=$1 and cod_gp=$2 and verified_status like 'noread') as n2,
    (select count(gtin) total from marking.line where batch_date=$1 and cod_gp=$2) as n3,
    (select count(gtin) duplicate from marking.line where batch_date=$1 and cod_gp=$2 and (verified_status like 'duplicate' or verified_status like 'wrong_product')) as n4;''',
                                                           app["current_batch_date"], app['current_cod_gp'])
                        print(result)
                        json = {"good_codes": result['good'], "defect_codes": result['defect'],
                                "total_codes": result['total'], "duplicates_codes": result['duplicate']}
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
    async with pool.acquire() as connection:
        async with connection.transaction():
            records = await connection.fetch(
                f''' select param_name,param_value from marking.settings_plc where line_number=$1 order by param_name;''',
                app['markstation_id'])
            result = {}
            for record in records:
                result[record[0]] = record[1]
    return result


async def get_available_product_list(app):
    pool = app['local_server']
    table_name = "available_products "

    async with pool.acquire() as connection:
        async with connection.transaction():
            record = await connection.fetch("select cod_gp,concat('(',cod_gp,')-',name) from marking.available_products where line = $1;",
                                            app['markstation_id'])

    result = {}
    for line in record:
        # print(line[0])
        # print(line[1])
        result[line[0]] = line[1]

    return result


async def save_settings_into_db(app, plc_settings):
    pool = app['local_server']
    async with pool.acquire() as connection:
        async with connection.transaction():
            for element in plc_settings:
                await connection.execute(
                    "update marking.settings_plc set param_value=$1 where param_name=$2 and line_number=$3",
                    plc_settings[element], element, app['markstation_id'])

    return


async def save_logs(app, message):
    pool = app['local_server']
    markstation_id = app['markstation_id']
    async with pool.acquire() as connection:
        async with connection.transaction():
            await connection.fetch('insert into marking.logs (line,message) values ($1,$2)', markstation_id, str(message))

    return


async def get_gtin_by_cod_gp(app, cod_gp):
    pool = app['local_server']
    table_name = "available_products "

    async with pool.acquire() as connection:
        async with connection.transaction():
            record = await connection.fetch(
                "select gtin from marking.available_products where line = $1 and cod_gp=$2",
                app['markstation_id'],cod_gp)
    return(record[0]['gtin'])

