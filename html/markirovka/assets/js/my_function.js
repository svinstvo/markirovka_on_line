function startup() {
        subscribe_ws();
        setInterval(check_ws,5000)
    }

    function check_ws(){
        console.log(ws);
        if (ws.readyState !== 1) {
            subscribe_ws()
        }
    }

    function subscribe_ws() {
        console.log("connect");
        ws = new WebSocket("ws://nginx.klever.ru:8090/line/ws");
        ws.onmessage = function(event) {
            console.log(event);
            load_json()
        };
        load_json()
    }


    async function load_json() {
            url = 'http://nginx.klever.ru/line/statistic';
            $.ajax({
                url:url.toString(),
                dataType: 'text',
                success:function (result) {
                    console.log(result);
                    JSONObject = JSON.parse(result);
                    document.getElementById('count_total').innerText=JSONObject['total_codes']
                    document.getElementById('count_good').innerText=JSONObject['good_codes']
                    document.getElementById('count_bad').innerText=JSONObject['defect_codes']
                }
            });
        }