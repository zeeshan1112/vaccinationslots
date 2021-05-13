$(document).ready(function() {
    $("input[name$='searchType']").click(function() {
        var test = $(this).val();
        if (test === "pin") {
            $("#district-field").hide()
            $("#pin-field").show()
        } else {
            $("#pin-field").hide()
            $("#district-field").show()
        }
    });
    $.ajax({
        type: "GET",
        url: "/resources/district_mapping.csv",
        dataType: "text",
        success: function(data) {
            let lines = processCsvData(data);
            populateSelect(lines);
        }
    })
});
var VaccineSlots = function() {};

async function searchByDistrict() {
    const minSlots = Number(document.getElementById("minslots").value);
    document.getElementById("available").innerHTML = "Checking availability for " + minSlots + " slots..."
    let vaccines = [];
    if (document.getElementById("covishield").checked) {
        vaccines.push("COVISHIELD");
    }
    if (document.getElementById("covaxin").checked) {
        vaccines.push("COVAXIN");
    }
    let fees = [];
    if (document.getElementById("free").checked) {
        fees.push("Free");
    }
    if (document.getElementById("paid").checked) {
        fees.push("Paid");
    }
    var minAge = document.getElementById("minage").value;
    var districtCode = document.getElementById("select-district").value;
    var date = new Date().toLocaleDateString().replaceAll("/", "-");
    var baseUrl = "https://cdn-api.co-vin.in/api/v2/appointment/sessions/calendarByDistrict?";
    var url = baseUrl + "district_id=" + districtCode + "&date=" + date;
    var response = httpGet(url);
    try {
        var response = JSON.parse(response);
        response.centers.forEach(function(center) {
            if (center && center.sessions) {
                if (fees.indexOf(center.fee_type) !== -1) {
                    center.sessions.forEach(function(session) {
                        if (session.min_age_limit == minAge && session.available_capacity >= minSlots && vaccines.indexOf(session.vaccine) !== -1) {
                            var audio = new Audio('https://media.geeksforgeeks.org/wp-content/uploads/20190531135120/beep.mp3');
                            audio.play();

                            var fee = center.vaccine_fees ? center.vaccine_fees[0].fee : 0;
                            var vaccine = center.vaccine_fees ? center.vaccine_fees[0].vaccine : session.vaccine;
                            var aData = [center.name, session.date, session.available_capacity, vaccine, session.min_age_limit, fee, center.address, center.district_name, center.fee_type];
                            addToTable(aData);
                        }

                    });
                }
            }
        });
    } catch (e) {}
    await sleepNow(1000);
    var tableLength = document.getElementById("vaccine-table").rows.length - 1;
    for (var i = 0; i < tableLength; i++) {
        document.getElementById("vaccine-table").deleteRow(1);
    }
    searchByDistrict();
};

VaccineSlots.prototype.searchByPin = function() {

};

function checkSlots() {
    searchByDistrict();
}

function processCsvData(allText) {
    var allTextLines = allText.split(/\r\n|\n/);
    var headers = allTextLines[0].split(',');
    var lines = [];
    for (var i = 1; i < allTextLines.length; i++) {
        var data = allTextLines[i].split(',');
        if (data.length == headers.length) {
            var tarr = [];
            for (var j = 0; j < headers.length; j++) {
                tarr.push(headers[j] + ":" + data[j]);
            }
            lines.push(tarr);
        }
    }
    return lines;
}

function populateSelect(lines) {
    var select = document.getElementById("select-district");
    var selectedRow = 0;
    for (var i = 0; i < lines.length; i++) {
        var option = document.createElement('option');
        let districtCode = lines[i][1].split(":")[1];
        selectedRow = districtCode == 294 ? i : selectedRow;
        option.value = districtCode;
        option.innerHTML = lines[i][0].split(":")[1];
        select.appendChild(option);
    }
    select.selectedIndex = selectedRow;
}

function addToTable(aData) {
    var hTable = document.getElementById("vaccine-table");
    var rowCount = hTable.rows.length;
    var tr = hTable.insertRow(rowCount);
    for (var i = 0; i < 9; i++) {
        var td = document.createElement("td").setAttribute("id", "table-data");
        td = tr.insertCell(i);
        td.innerHTML = aData[i];
    }

}

function httpGet(url) {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open("GET", url, false); // false for synchronous request
    xmlHttp.send(null);
    return xmlHttp.responseText;
}

var sleepNow = (delay) => new Promise((resolve) => setTimeout(resolve, delay))