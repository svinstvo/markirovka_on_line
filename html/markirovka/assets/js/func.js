// Показ сервисного режима
document.getElementById('service').onclick = function()
{
    let m = document.getElementById('main_content');
    let s = document.getElementById('service_content');
    m.style.display = "none";
    s.style.display = "block"
    let service = document.getElementById('service');
    service.classList.add('service_red');
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
    setInterval(check_ws,5000);
    fill_controller_settings();
};

// функция для кнопки перезагрузки
function reload_button(){
    get_date_from_json();
    fill_product_selector();
    fill_controller_settings();
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
                    //console.log(JSONObject['current_batch_date']);
                   document.getElementById('current_date_main').innerText=JSONObject['current_batch_date']
                }
                //console.log(JSONObject['current_gtin']);
                //console.log(document.getElementById("product_selector").value);
                if (JSONObject['current_gtin'] !== document.getElementById("product_selector").value) {
                  console.log("не равно ")
                }

                //Заполенение последний 10 сканированных кодов
                let last_10_codes = document.getElementById("last_10_codes");
                last_10_codes.innerHTML="";
                JSONObject['last_10_codes'].reverse().forEach(function (element){
                    if (isNaN(element.charAt(0))) {
                        last_10_codes.innerHTML+="<div class='status_bad'>"+ element+"</div>"
                    } else  {
                        last_10_codes.innerHTML+="<div class='status_ok'>"+ element+"</div>"
                    }
                })

                // статус в шапке
                let scanner_status = JSONObject["plc_state"]["alarm_no_scanner"];
                green_red_status("scanner_status", scanner_status);
                let controller_status = JSONObject["plc_last seen"];
                if(controller_status<1.5){
                    green_red_status("controller_status", 1)
                } else {
                    green_red_status("controller_status", 0)
                }

                // определение debug_mode из JSON
                let debug_mode_value = JSONObject["status"]["debug_mode"];
                //console.log("debug mode = " + debug_mode_value);
                if(String(debug_mode_value)==="0"){
                    document.getElementById("debug_switch_id").checked=true;
                    document.getElementById("debug_status_name").innerText = "запись";
                } else {
                    document.getElementById("debug_switch_id").checked=false;
                    document.getElementById("debug_status_name").innerText = "пауза";
                }

                // статусы PLC для кипа на сервисной странице
                let plc_state = document.getElementById("plc_state");
                let obj = JSONObject['plc_state'];
                for(let key in obj) {
                    if(document.getElementById("id_"+key)) {
                        console.log("true");
                        document.getElementById("id_"+key).innerHTML = key + " " +obj[key];
                    } else {
                        console.log("false")
                        let dateSpan = document.createElement('span');
                        dateSpan.innerHTML = key + " " + obj[key];
                        dateSpan.id = "id_"+ key;
                        let li = document.createElement('li');
                        li.appendChild(dateSpan);
                        plc_state.appendChild(li);
                    }
                }
            }
        });
}

// Функция записи значения debug_mode
function set_debug_mode() {
    console.log("debug_switch_id = " +document.getElementById("debug_switch_id").checked)
    let debugSwitchId = document.getElementById("debug_switch_id").checked;
    let url = new URL(window.location.origin + "/line/web_interface/set_debug_mode");
    url.searchParams.append('debug_mode', +!debugSwitchId);
    console.log(url.toString());
    $.ajax({
        url:url.toString(),
        dataType: 'text',
        success:function (response){
            console.log(response)
        },
        error:function (xhr){
            console.log(xhr)
        }
    })
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
};

// функция собирает настройки со страницы и отправляет на сервер
function send_settings() {
    let settings = {};
    var inputs = document.getElementById("plc_settings").getElementsByClassName("plc_settings");
    //console.log(inputs);
        for (var i = 0, len = inputs.length; i < len; ++i){
            if(inputs.hasOwnProperty(i))
                row = inputs[i];
                settings[row.id] = row.value;
        }
    url=new URL(window.location.origin +"/line/web_interface/set_controller_settings");
    $.ajax({
        url:url,
        data:settings,
        success:function (response){
            console.log(response)
        },
        error:function (xhr){
            console.log(xhr)
        }
    })
}

// функция для определения статуса (id: элемент, который красим;
//                                  Value: 1 - зеленый, 0 и другие - красный)
function green_red_status(id, value){
    if (String(value)==="1"){
        document.getElementById(String(id)).classList.remove("status_bad");
        document.getElementById(String(id)).classList.add("status_ok");
    } else {
        document.getElementById(String(id)).classList.remove("status_ok");
        document.getElementById(String(id)).classList.add("status_bad");
    }
};