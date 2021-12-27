// Показ сервисного режима
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

// Показ основного режима
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

// Запуск функций при загрузке
window.onload = function()
{
    //get_date_from_user();
    get_date_from_json();
    fill_product_selector();
    subscribe_ws();
    subscribe_on_select();
    setInterval(check_ws,5000)
    fill_controller_settings()
};

// Функция получения и отображения даты из JSON
function get_date_from_json() {
    let url = window.location.origin +"/line/statistic";
        $.ajax({
            url: url.toString(),
            dataType: 'text',
            success: function (result) {
                //console.log(result);
                JSONObject = JSON.parse(result);
                console.log("JSONObject['current_batch_date'] = " + JSONObject['current_batch_date']);
                document.getElementById('current_date_main').innerText=JSONObject['current_batch_date']
                document.getElementById('current_date_modal').innerText=JSONObject['current_batch_date']
            }
        })
};

// кнопка переключения даты на день вперед
document.getElementById('button_right').onclick = function()
{
    let currdate = document.getElementById('current_date_modal').innerHTML
    let tomorrow = new Date(currdate);
    tomorrow.setDate(tomorrow.getDate() + 1);
    let dd = tomorrow.getDate();
    dd = (dd < 10) ? '0' + dd : dd;
    let mm = tomorrow.getMonth() + 1;
    let yyyy = tomorrow.getFullYear();
    tomorrow = yyyy + '-' + mm + '-' + dd;
    document.getElementById('current_date_modal').innerHTML = tomorrow;
};

// кнопка переключения даты на день назад
document.getElementById('button_left').onclick = function()
{
    let currdate = document.getElementById('current_date_modal').innerHTML
    let yesterday = new Date(currdate);
    yesterday.setDate(yesterday.getDate() - 1);
    let dd = yesterday.getDate();
    dd = (dd < 10) ? '0' + dd : dd;
    let mm = yesterday.getMonth() + 1;
    let yyyy = yesterday.getFullYear();
    yesterday = yyyy + '-' + mm + '-' + dd;
    document.getElementById('current_date_modal').innerHTML = yesterday;
};

// кнопка закрытия всплывающего окна с датой (применить)
document.getElementById('modal_close').onclick = function()
{
    let m = document.getElementById('modal-1');
    m.style.display = "none";
    set_date_on_server();
};

// вторая кнопка закрытия всплывающего окна с датой (крестик)
document.getElementById('modal_close2').onclick = function()
{
    let m = document.getElementById('modal-1');
    m.style.display = "none";
    get_date_from_json();
};

// Всплывающее окно с датой по смене продукта
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

// функция переключения даты на сервере
function set_date_on_server() {
        current_date=document.getElementById('current_date_modal').innerText;
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
                selected_gtin = JSONObject['current_gtin'];                       
                document.getElementById("product_selector").value = selected_gtin;
                document.getElementById('count_total').innerText=JSONObject['total_codes'];
                document.getElementById('count_bad').innerText=JSONObject['defect_codes'];
                document.getElementById('count_good').innerText=JSONObject['good_codes'];
                document.getElementById('count_duplicates').innerText=JSONObject['duplicates_codes'];
                status_text = JSONObject['status']['message'];
                document.getElementById('status_bar').innerHTML = status_text;
                status = JSONObject['status']['state'];
                // console.log("status = " + status);
                if (String(status) === "1") {
                    // console.log("status if = " + status);
                    document.getElementById("status_id").classList.remove("status_ok");
                    document.getElementById("status_id").classList.add("status_bad");
                } else {
                    // console.log("status else = " + status);
                    document.getElementById("status_id").classList.remove("status_bad");
                    document.getElementById("status_id").classList.add("status_ok");
                }
                // console.log("status_text = " + status_text);
                if (JSONObject['current_batch_date']==='1-01-01') {
                    console.log("empty date");
                    set_date_on_server()
                } else {
                    console.log(JSONObject['current_batch_date']);
                   document.getElementById('current_date_main').innerText=JSONObject['current_batch_date']
                }


                //console.log(JSONObject['current_gtin']);
                //console.log(document.getElementById("product_selector").value);
                if (JSONObject['current_gtin'] !== document.getElementById("product_selector").value) {
                  console.log("не равно ")
                }
            }
        });
}

// функция заполнения продуктами для выбора из селектора
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
                    opt.id = "id_" + k;
                    opt.innerHTML = JSONObject[k];
                    selector.add(opt,null)
                }
            }
        });
}

// переключение в debug_mode
async function debug_mode(boolean) {
    url=new URL(window.location.origin +"/line/web_interface/get_controller_settings");
    $.ajax({
        url:url.toString(),
        dataType: 'text',
        success:function (result) {
            JSONObject = JSON.parse(result);
            console.log("debug mode = " + JSONObject["status"]["debug_mode"]);
            //JSONObject['debug_mode'] = boolean
        }
    })
}

// загрузка настроек из JSON и заполнение
function fill_controller_settings() {
    url=new URL(window.location.origin +"/line/web_interface/get_controller_settings");
    $.ajax({
        url: url.toString(),
        dataType: 'text',
        success: function (result) {
            JSONObject = JSON.parse(result);
            option = document.getElementById("settings")
                for (var k in JSONObject) {
                    //console.log(k + " " + JSONObject[k])
                    if(JSONObject.hasOwnProperty(k))
                        obj = JSONObject[k];
                        $('input[id=' +k +']').val(obj);
                        $('input[id=' +k +'1]').val(obj);
                }
        }
    })
}

// Функция получения статуса чтения кода из JSON
async function get_status(){
     url=new URL(window.location.origin +"/line/statistic");
     $.ajax({
         url: url.toString(),
         dataType: 'text',
         success: function (result){
             JSONObject = JSON.parse(result);
             status_text = JSONObject['status']['message'];
             document.getElementById('status_bar').innerHTML = status_text;
             status = JSONObject['status']['state'];
             console.log("status = " + status);
             if (status === 1) {
                 document.getElementById("status_id").classList.remove("status_ok");
                 document.getElementById("status_id").classList.add("status_bad");
             } else {
                 document.getElementById("status_id").classList.remove("status_bad");
                 document.getElementById("status_id").classList.add("status_ok");
             }
             console.log("status_text = " + status_text);
         }
     })
}