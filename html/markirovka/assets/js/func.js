document.getElementById('service').onclick = function() 
{
    let m = document.getElementById('main_content');
    let s = document.getElementById('service_content');
    m.style.display = "none";
    s.style.display = "block"
};

document.getElementById('noservice').onclick = function() 
{
    let m = document.getElementById('main_content');
    let s = document.getElementById('service_content');
    m.style.display = "block";
    s.style.display = "none"
};

window.onload = function() 
{
    let today = new Date();
    let dd = today.getDate();
    dd = (dd < 10) ? '0' + dd : dd;
    let mm = today.getMonth() + 1;
    let yyyy = today.getFullYear();
    today = yyyy + '-' + mm + '-' + dd;
    document.getElementById('current_date').innerHTML = today;

    subscribe_ws();
    setInterval(check_ws,5000)
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
};


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


    async function load_json() {
        let url = window.location.origin +"/line/statistic";
            $.ajax({
                url:url.toString(),
                dataType: 'text',
                success:function (result) {
                    //console.log(result);
                    JSONObject = JSON.parse(result);
                    document.getElementById('count_total').innerText=JSONObject['total_codes']
                    document.getElementById('count_good').innerText=JSONObject['good_codes']
                    document.getElementById('count_bad').innerText=JSONObject['defect_codes']
                }
            });
        }