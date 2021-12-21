document.getElementById('service').onclick = function() 
{
    let m = document.getElementById('main_content');
    let s = document.getElementById('service_content');
    m.style.display = "none";
    s.style.display = "block"
    let service = document.getElementById('service');
    service.classList.add('service_red');
    debug_mode(0);
};

document.getElementById('noservice').onclick = function() 
{
    let m = document.getElementById('main_content');
    let s = document.getElementById('service_content');
    m.style.display = "block";
    s.style.display = "none"
    let service = document.getElementById('service');
    service.classList.remove('service_red');
    debug_mode(1);
};


function subscribe_on_select() {
    document.getElementById("product_selector").addEventListener('change',function(){
        url=new URL(window.location.origin +"/line/web_interface/set_gtin");
        url.searchParams.append('gtin',this.value);
        console.log(url.toString());
        $.ajax({
            url:url.toString(),
            dataType: 'text',
            success:function (result) {
                console.log("set gtin: "+result);
            }
        });
    })
}

window.onload = function()
{
    let today = new Date();
    let dd = today.getDate() + 1;
    dd = (dd < 10) ? '0' + dd : dd;
    let mm = today.getMonth() + 1;
    let yyyy = today.getFullYear();
    today = yyyy + '-' + mm + '-' + dd;
    document.getElementById('current_date').innerHTML = today;
    theday = document.getElementById('current_date').innerHTML
    document.getElementById('current_date2').innerHTML = theday;
    fill_product_selector();
    subscribe_ws();
    subscribe_on_select();
    setInterval(check_ws,5000)
    fill_controller_settings()
};

document.getElementById('button_right').onclick = function()
{
    let currdate = document.getElementById('current_date').innerHTML
    let tomorrow = new Date(currdate);
    tomorrow.setDate(tomorrow.getDate() + 1);
    let dd = tomorrow.getDate();
    dd = (dd < 10) ? '0' + dd : dd;
    let mm = tomorrow.getMonth() + 1;
    let yyyy = tomorrow.getFullYear();
    tomorrow = yyyy + '-' + mm + '-' + dd;
    document.getElementById('current_date').innerHTML = tomorrow;
    document.getElementById('current_date2').innerHTML = tomorrow;
    set_date_on_server()
};

document.getElementById('button_left').onclick = function()
{
    let currdate = document.getElementById('current_date').innerHTML
    let yesterday = new Date(currdate);
    yesterday.setDate(yesterday.getDate() - 1);
    let dd = yesterday.getDate();
    dd = (dd < 10) ? '0' + dd : dd;
    let mm = yesterday.getMonth() + 1;
    let yyyy = yesterday.getFullYear();
    yesterday = yyyy + '-' + mm + '-' + dd;
    document.getElementById('current_date').innerHTML = yesterday;
    document.getElementById('current_date2').innerHTML = yesterday;
    set_date_on_server()
};

document.getElementById('modal_close').onclick = function()
{
    let m = document.getElementById('modal-1');
    m.style.display = "none"
}

document.getElementById('modal_close2').onclick = function()
{
    let m = document.getElementById('modal-1');
    m.style.display = "none"
}

document.getElementById('product_selector').onchange = function()
{
    let m = document.getElementById('modal-1');
    m.style.display = "block"
}

    function check_ws(){
        console.log(ws);
        if (ws.readyState !== 1) {
            subscribe_ws()
        }
    }

    function subscribe_ws() {
        console.log("connect");
        let url = "ws://"+window.location.host+"/line/ws";
        ws = new WebSocket(url);
        ws.onmessage = function(event) {
            console.log(event);
            load_json()
        };
        load_json()
    }


function set_date_on_server() {
        current_date=document.getElementById('current_date').innerText;
        url=new URL(window.location.origin +"/line/web_interface/set_current_batch_date");
        url.searchParams.append('date',current_date);
        console.log(url.toString());
        $.ajax({
            url:url.toString(),
            dataType: 'text',
            success:function (result) {
                console.log("set date: "+result);
            }
        });
}

async function load_json() {
        let url = window.location.origin +"/line/statistic";
        $.ajax({
            url:url.toString(),
            dataType: 'text',
            success:function (result) {
                //console.log(result);
                JSONObject = JSON.parse(result);
                document.getElementById('count_total').innerText=JSONObject['total_codes'];
                document.getElementById('count_good').innerText=JSONObject['good_codes'];
                document.getElementById('count_bad').innerText=JSONObject['defect_codes'];
                if (JSONObject['current_batch_date']==='1-01-01') {
                    console.log("empty date");
                    set_date_on_server()
                } else {
                    console.log(JSONObject['current_batch_date']);
                   document.getElementById('current_date').innerText=JSONObject['current_batch_date']
                }


                //console.log(JSONObject['current_gtin']);
                //console.log(document.getElementById("product_selector").value);
                if (JSONObject['current_gtin'] !== document.getElementById("product_selector").value) {
                  console.log("не равно ")
                }
            }
        });
}

function fill_product_selector() {
        url=new URL(window.location.origin +"/line/web_interface/get_available_product_list");
        $.ajax({
            url:url.toString(),
            dataType: 'text',
            success:function (result) {
                JSONObject = JSON.parse(result);
                selector=document.getElementById("product_selector")
                for (var k in JSONObject) {
                    //console.log(k +" " + JSONObject[k])
                    var opt = document.createElement('option');
                    opt.value = k;
                    opt.innerHTML = JSONObject[k];
                    selector.add(opt,null)
                }
            }
        });
}

async function debug_mode(boolean) {
    url=new URL(window.location.origin +"/line/web_interface/get_controller_settings");
    $.ajax({
        url:url.toString(),
        dataType: 'text',
        success:function (result) {
            JSONObject = JSON.parse(result);
            JSONObject['debug_mode'] = boolean
            console.log("debug mode = " + JSONObject["debug_mode"]);
        }
    })
}

function fill_controller_settings() {
    url=new URL(window.location.origin +"/line/web_interface/get_controller_settings");
    $.ajax({
        url: url.toString(),
        dataType: 'text',
        success: function (result) {
            JSONObject = JSON.parse(result);
            timebraknoread = JSONObject['time_brak_no_read'];
            document.getElementById('time_brak_no_read').value = timebraknoread;
            document.getElementById('time_brak_no_read1').value = timebraknoread;
            timebraknozazor = JSONObject['time_brak_no_zazor'];
            document.getElementById('time_brak_no_zazor').value = timebraknozazor;
            document.getElementById('time_brak_no_zazor1').value = timebraknozazor;
            timeimpulse = JSONObject['time_impulse'];
            document.getElementById('time_impulse').value = timeimpulse;
            document.getElementById('time_impulse1').value = timeimpulse;
            timeimpuakov = JSONObject['time_imp_upakov'];
            document.getElementById('time_imp_upakov').value = timeimpuakov;
            document.getElementById('time_imp_upakov1').value = timeimpuakov;
            failtobrakecount = JSONObject['zadanie_count_brak'];
            document.getElementById('zadanie_count_brak').value = failtobrakecount;
            document.getElementById('zadanie_count_brak1').value = failtobrakecount;
        }
    });
}
