$(document).ready( function () {
      $("#myTable").tablesorter();
});
function mtrmove(obj){
    var evt = event || window.event;
    var x = evt.clientX - 275;
    var y = evt.clientY;
    document.getElementById("tip").style.left = x + 'px';
    document.getElementById("tip").style.top = y + 'px';
    document.getElementById("tip").innerHTML = obj.innerHTML;
    document.getElementById("tip").style.display = 'block';
}
function mtrout(){
    document.getElementById("tip").style.display = 'none';
}

$(function() {
$('#myTable').bootstrapTable("resetView")({
cache: false,
height: 600,
// minimumCountColumns: 2,
// pagination: true,
// pageSize: 50,
// pageList: [10, 25, 50, 100, 200],
// smartDisplay: true, // 智能显示 pagination 和 cardview 等
showRefresh: true,
showColumns: true, // 开启自定义列显示功能
// search: true
})
});


// time-pct
window.addEventListener('load', function() {
  showProgress();
  setInterval(showProgress, 100);
});

function oneLinePercentage() {
  return ((new Date() - new Date(new Date().getFullYear(), 0, 1)) / (new Date(new Date().getFullYear(), 11, 31, 23, 59, 59, 999) - new Date(new Date().getFullYear(), 0, 1)));
}

function showProgress() {
  var result = oneLinePercentage() * 100;
  document.getElementById("progressBar").value = result;
  document.getElementById("p").innerHTML = "<h2>" + result.toString().substr(0, 11) + "%" + "<\/h2>";
  console.log(result);
}
