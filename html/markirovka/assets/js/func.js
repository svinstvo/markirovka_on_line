document.getElementById('service').onclick = function() 
{
    let m = document.getElementById('main_content');
    let s = document.getElementById('service_content');
    m.style.display = "none"
    s.style.display = "block"
};

document.getElementById('noservice').onclick = function() 
{
    let m = document.getElementById('main_content');
    let s = document.getElementById('service_content');
    m.style.display = "block"
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
}

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
}

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
}