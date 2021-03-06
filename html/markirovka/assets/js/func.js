let deltaDays = 0;
load_json();

// Показ сервисного режима
function service_mode() {
    let m = document.getElementById('main_content');
    let s = document.getElementById('service_content');
    m.style.display = "none";
    s.style.display = "block"
    let service = document.getElementById('service');
    service.classList.add('service_red');
};

// Показ основного режима
function noservice_mode() {
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
        url.searchParams.append('cod_gp',this.value);
        //console.log(url.toString());
        $.ajax({
            url:url.toString(),
            dataType: 'text',
            success:function (result) {
                //console.log("cod_gp: "+result);
            }
        });
    })
}

// Запуск функций при загрузке
window.onload = function()
{
    //get_date_from_user();
    fill_product_selector();
    get_date_from_json();
    subscribe_ws();
    subscribe_on_select();
    setInterval(check_ws,5000);
    fill_controller_settings();
    open_modal_with_date();
    hideDateButton();
};

// Функция получения и отображения даты на странице из JSON
// а в модальном окне исходя из времени пк
function get_date_from_json() {
    let url = window.location.origin +"/line/statistic";
        $.ajax({
            url: url.toString(),
            dataType: 'text',
            success: function (result) {
                //console.log(result);
                JSONObject = JSON.parse(result);
                //console.log("JSONObject['current_batch_date'] = " + JSONObject['current_batch_date']);
                document.getElementById('current_date_main').innerText=JSONObject['current_batch_date'];
                let dateString = document.getElementById('current_date_modal').innerText;
                document.getElementById('current_date_modal').innerText = datePlusDelta(dateString, deltaDays);
            }
        })
};

// костыль для возможности добавления дней к дате
// dateString - строка даты в формате ISO
// delta - разница дней для станции
function datePlusDelta (dateString, delta) {
    if (delta == 0) {
        dateString = new Date().toISOString().slice(0,10);
        return dateString;
    } else {
        let symbol = delta.slice(0,1);
        let num = delta.slice(1);
        try {
            num = Number(num)
        } catch {console.log("error datePlusDelta")}
        let date = new Date();
        console.log('datestring ' + date);
        if (symbol=="+") {
            date.setDate(date.getDate() + num)
        } else if (symbol=="-") {
            date.setDate(date.getDate() - num)
        } else {
            console.log("error datePlusDelta")
        };
        dateString = date.toISOString().slice(0,10);
        console.log('datestring ' + dateString);
        return dateString;
    };
};
// функция ставит текущую дату
function set_current_date() {
    let dateISOFromSystem = new Date().toISOString().slice(0,10);
    console.log("dateISOFromSystem = " + dateISOFromSystem);
};

// функция для скрывания кнопок переключения даты
function hideDateButton() {
    let dateStringFromPageModal = document.getElementById('current_date_modal').innerText;
    //console.log("dateStringFromPage = " + dateStringFromPageModal);
    let dateISOFromPage = new Date(dateStringFromPageModal).toISOString().slice(0,10);
    console.log("dateISOFromPage = " + dateISOFromPage);
    let dateISOFromSystem = new Date().toISOString().slice(0,10);
    console.log("dateISOFromSystemReal = " + dateISOFromSystem);
    dateISOFromSystem = datePlusDelta(dateISOFromSystem, deltaDays);
    console.log("dateISOFromSystemDelta = " + dateISOFromSystem);     //delta
    // убираем ошибку с датой до необходимых значений
    dateISOFromPage < dateISOFromSystem ? (dateISOFromPage = dateISOFromSystem) : console.log('date good');

    // мини функция для получения даты на +10 дней
    Date.prototype.addDays = function() {
        let date = new Date(this.valueOf());
        date.setDate(date.getDate() + 10);
        return date.toISOString().slice(0,10);
    }
    let dateFromSystem = new Date();
    let datePlusTenDays = dateFromSystem.addDays();

    let LButton = document.getElementById('button_left');
    let needToHide = (dateISOFromPage===dateISOFromSystem);
    needToHide ? LButton.style.display = "none" : LButton.style.display = "initial";
    let RButton = document.getElementById('button_right');
    let needToHideMore = (dateISOFromPage===(datePlusTenDays));
    needToHideMore ? RButton.style.display = "none" : RButton.style.display = "initial";
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
    mm = (mm < 10) ? '0' + mm : mm;
    let yyyy = tomorrow.getFullYear();
    tomorrow = yyyy + '-' + mm + '-' + dd;
    document.getElementById('current_date_modal').innerHTML = tomorrow;
    hideDateButton()
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
    mm = (mm < 10) ? '0' + mm : mm;
    let yyyy = yesterday.getFullYear();
    yesterday = yyyy + '-' + mm + '-' + dd;
    document.getElementById('current_date_modal').innerHTML = yesterday;
    hideDateButton()
};

// кнопка закрытия всплывающего окна с датой (применить)
function accept_modal_with_date() {
    $('#modal-1').modal('hide')
    set_date_on_server();
};

// Всплывающее окно с датой по смене продукта
function open_modal_with_date() {
    $('#modal-1').modal('show')
};

// пароль
const passPhrase = "2022"
// Всплывающее окно с вводом пароля
async function open_modal_with_password() {
    let inputField = document.getElementById('id_password')
    inputField.value = getWithExpiry("myKey");
    if (inputField.value===passPhrase) {
        service_mode()
    } else {
        $('#modal-password').modal('show')
        switch_toggle(0)
    }
    erase_inputField()
};

// Закрытие окно с паролем
function close_modal_with_password() {
    $('#modal-password').modal('hide');
}

// Функция для добавления цифры в поле пароля
function addNumber(element) {
    document.getElementById('id_password').value += element.value;
}

function erase_inputField() {
    document.getElementById('id_password').value = ""
}

// функция правильного отображения переключателя сервисного режима
function switch_toggle(key) {
    maincont = document.getElementById('main_content').style.display
    if(key === 0){
        document.getElementById('cond_new').click()
    } else {
        document.getElementById('cond_used').click()
    }
}

// функция проверки пароля
function check_password() {
    let pass = document.getElementById('id_password').value;
    setWithExpiry("myKey", pass, 600000)

    if(String(pass)===passPhrase) {
        close_modal_with_password()
        service_mode()
        switch_toggle(1)
    } else {
        alert("wrong password")
        erase_inputField()
        switch_toggle(0)
        close_modal_with_password()
    }
}

// функция добавления пароля в localstorage
function setWithExpiry(key, value, ttl) {
    const now = new Date()
    const item = {
        value: value,
        expiry: now.getTime() + ttl,
    }
    localStorage.setItem(key, JSON.stringify(item))
}

// функция получения пароля из localstorage
function getWithExpiry(key) {
    const itemStr = localStorage.getItem(key)
    if (!itemStr) {
        return null
    }
    const item = JSON.parse(itemStr)
    const now = new Date()
    if (now.getTime() > item.expiry) {
        localStorage.removeItem(key)
        return null
    }
    return item.value
}

    function check_ws(){
        //console.log(ws);
        if (ws.readyState !== 1) {
            subscribe_ws()
        }
    }

    function subscribe_ws() {
        console.log("connect");
        let url = "ws://"+window.location.host+"/line/ws";
        ws = new WebSocket(url);
        ws.onmessage = function(event) {
            //console.log(event);
            load_json();
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

function load_json() {
        let url = window.location.origin +"/line/statistic";
        $.ajax({
            url:url.toString(),
            dataType: 'text',
            success:function (result) {
                //console.log(result);
                let JSONObject = JSON.parse(result);
                let selected_cod_gp = JSONObject['current_cod_gp'];
                document.getElementById("product_selector").value = selected_cod_gp;
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
                    //console.log("empty date");
                    set_date_on_server()
                } else {
                   //console.log("current_batch_date = " + JSONObject['current_batch_date']);
                   document.getElementById('current_date_main').innerText=JSONObject['current_batch_date']
                }
                //console.log("current_cod_gp = " + JSONObject['current_cod_gp']);
                //console.log("product_selector.value1 = " + document.getElementById("product_selector").value);
                if (JSONObject['current_cod_gp'] !== document.getElementById("product_selector").value) {
                    //console.log("current_cod_gp != product_selector.value")
                    //console.log("пробуем заново")
                }

                //Заполенение последний 10 сканированных кодов
                let last_10_codes = document.getElementById("last_10_codes");
                last_10_codes.innerHTML="";
                JSONObject['last_10_codes'].reverse().forEach(function (element){
                    stringel = element.replace(/</g, "&lt;");
                    //stringel = element.replace(/>/g, "&gt;");
                    if (isNaN(element.charAt(0))) {
                        last_10_codes.innerHTML+="<div class='status_bad' style='border: 1px solid;'>"+ stringel+"</div>"
                    } else  {
                        last_10_codes.innerHTML+="<div class='status_ok' style='border: 1px solid;'>"+ stringel+"</div>"
                    }
                })

                // статус в шапке
                let scanner_status = JSONObject["plc_state"]["alarm_no_scanner"];
                green_red_status("scanner_status", scanner_status, 1);
                let controller_status = JSONObject["plc_last seen"];
                if(controller_status<1.5){
                    green_red_status("controller_status", 1, 1)
                } else {
                    green_red_status("controller_status", 0, 1)
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

                // отображение message_from_plc на главной странице
                document.getElementById("messageFromPlcMain").innerHTML = JSONObject['plc_state']['message_from_plc'];
                // статусы PLC для кипа на сервисной странице
                let plc_state = document.getElementById("plc_state");
                let obj = JSONObject['plc_state'];
                for(let key in obj) {
                    if(document.getElementById("id_"+key)) {
                        document.getElementById("id_"+key).innerHTML = key + " " + "<b>" +obj[key] + "</b>";
                    } else {
                        let dateSpan = document.createElement('span');
                        dateSpan.innerHTML = key + " " + "<b>" +obj[key] + "</b>";
                        dateSpan.id = "id_"+ key;
                        let li = document.createElement('li');
                        li.appendChild(dateSpan);
                        plc_state.appendChild(li);
                    }
                }

                // покраска кнопок старт-стоп-сброс
                let startStatus = JSONObject["status"]["button_start_pressed"]
                let stopStatus = JSONObject["status"]["button_stop_pressed"]
                let resetStatus = JSONObject["status"]["button_reset_pressed"]
                green_red_status("manageButton", startStatus + 1, 1);
                green_red_status("manageButton2", stopStatus + 1, 1);
                green_red_status("manageButtonReset",resetStatus + 1, 1);

                // station id в кнопку
                document.getElementById("markstation_id").innerText = JSONObject["markstation_id"];

                // print status
                // отображение блока для принтеров
                let printAvailable = JSONObject["print_available"];
                let printerBlock = document.getElementById("printer_block").style;
                printAvailable ? printerBlock.display = "flex" : printerBlock.display = "none";

                // статус переключателя для принтера
                try {
                    let print_mode_value = JSONObject["printer"]["printing"];
                    console.log("print mode = " + print_mode_value);
                    document.getElementById("print_switch_id").checked = String(print_mode_value) === "1";
                } catch (e) {
                    console.log("no printer");
                }

                // статус доступности клиентской станции
                let ResponseNot200 = JSONObject["stat_servers_response_not_200"];
                green_red_status("bg_markstation_id", ResponseNot200, 0)

                // добавление дельты для станций
                deltaDays = JSONObject["delta_days_onstartup"];
            }
        });
}

// Функция записи значения printing
function set_print_mode() {
    console.log("print_switch_id = " +document.getElementById("print_switch_id").checked)
    let printSwitchId = document.getElementById("print_switch_id").checked;
    let url = new URL(window.location.origin + "/line/web_interface/set_print_mode");
    url.searchParams.append('printing', +printSwitchId);
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

// функция с кнопками управления plc
function plc_manage(button){
    let sendKey = "";
    if(button==="reset"){
        //console.log("reset");
        sendKey = "reset";
    } else if(button==="stop"){
        //console.log("stop");
        sendKey = "stop";
    } else if(button==="start"){
        //console.log("start");
        sendKey = "start";
    } else {
        console.log("error")
    }

    //console.log(sendKey);

    url=new URL(window.location.origin +"/line/web_interface/button_pressed");
    $.ajax({
        url: url,
        data: "button=" + sendKey,
        success: function (response) {
            //console.log(response)
        },
        error: function (xhr) {
            console.log(xhr)
        }
    });
}

// Функция записи значения debug_mode
function set_debug_mode() {
    //console.log("debug_switch_id = " +document.getElementById("debug_switch_id").checked)
    let debugSwitchId = document.getElementById("debug_switch_id").checked;
    let url = new URL(window.location.origin + "/line/web_interface/set_debug_mode");
    url.searchParams.append('debug_mode', +!debugSwitchId);
    //console.log(url.toString());
    $.ajax({
        url:url.toString(),
        dataType: 'text',
        success:function (response){
            //console.log(response)
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
                load_json()
            }
        });
};


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
            let camera_html = document.getElementById("camera_optimization");
            //console.log("cam_html = " + camera_html.checked)
            let cam_status = JSONObject["camera_optimization"];
            //console.log("cam_status = " + cam_status);
            camera_html.checked = cam_status === "1";
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
            //console.log(response)
        },
        error:function (xhr){
            console.log(xhr)
        }
    })
    hide_reset_button()
}

// Функция для тумблеров Checked = Value(1)
function tumblerValue(id) {
    let tumbler = document.getElementById(id);
    if(tumbler.checked === true){
        tumbler.value = 1;
    } else {
        tumbler.value = 0;
    }
}

// функция отображения кнопки сброса настроек на те что сейчас в базе
function reset_settings() {
    let button = document.getElementById("reset_button");
    button.style.display = "initial"
}

// функция скрытия кнопки сброса настроек
function hide_reset_button() {
    let button = document.getElementById("reset_button");
    button.style.display = "none"
}

// функция для определения статуса (id: элемент, который красим;
//                                  Value: 1 - зеленый, 0 и другие - красный)
function green_red_status(id, value, needToGreen){
    //console.log(id, value, needToGreen);
    if (String(value)===String(needToGreen)){
        document.getElementById(String(id)).classList.remove("status_bad");
        document.getElementById(String(id)).classList.add("status_ok");
    } else {
        document.getElementById(String(id)).classList.remove("status_ok");
        document.getElementById(String(id)).classList.add("status_bad");
    }
};