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
    });
});

var searching = false;
var searchByDistrict = true;

async function searchSlots() {
    var url = getUrl();
    var oValues = getInputValues();
    const minSlots = oValues.userMinSlots;
    document.getElementById("available").innerHTML = "Checking availability for " + minSlots + " slots...";
    var vaccines = oValues.selectedVaccines;
    var fees = oValues.selectedFeeType;
    var minAge = oValues.selectedMinAge;
    var response = httpGet(url);
    try {
        response = JSON.parse(response);
        response.centers.forEach(function(center) {
            if (center && center.sessions) {
                if (fees.indexOf(center.fee_type) !== -1) {
                    center.sessions.forEach(function(session) {
                        if (session.min_age_limit == minAge && session.available_capacity_dose1 >= minSlots && vaccines.indexOf(session.vaccine) !== -1) {
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
    if(searching) {
        searchSlots(url);
    }
};

function checkSlots() {
    searching = !searching;
    $('#submit-button').toggleClass('btn-primary btn-danger');
    if(searching) {
        $("#available").show();
        $("#slotTable").show();
        document.getElementById("submit-button").innerHTML = "Stop Searching";
        searchSlots();
    } else {
        $("#available").hide();
        $("#slotTable").hide();
        document.getElementById("submit-button").innerHTML = "Start Searching";
    }
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
    doColorCoding(aData[2], tr);
}

function doColorCoding(availableCapacity, tr) {
    if (availableCapacity < 5) {
        tr.setAttribute("class", "danger");
    } else if (availableCapacity >= 5 && availableCapacity < 20) {
        tr.setAttribute("class", "warning");
    } else if (availableCapacity >= 20) {
        tr.setAttribute("class", "success");
    }
}

function getInputValues() {
    const minSlots = Number(document.getElementById("minslots").value);
    let oValues = {};
    let vaccines = [];
    let fees = [];
    if (document.getElementById("covishield").checked) {
        vaccines.push("COVISHIELD");
    }
    if (document.getElementById("covaxin").checked) {
        vaccines.push("COVAXIN");
    }
    if (document.getElementById("free").checked) {
        fees.push("Free");
    }
    if (document.getElementById("paid").checked) {
        fees.push("Paid");
    }
    var minAge = document.getElementById("minage").value;
    oValues.userMinSlots = minSlots;
    oValues.selectedVaccines = vaccines;
    oValues.selectedFeeType = fees;
    oValues.selectedMinAge = minAge;
    return oValues;
}

function getUrl() {
    var url = "https://cdn-api.co-vin.in/api/v2/appointment/sessions/";
    var date = new Date().toLocaleDateString().replaceAll("/", "-");
    if (document.getElementById("radio-district").checked) {
        // if search is by district
        var districtCode = document.getElementById("select-district").value;
        url = url + "calendarByDistrict?district_id=" + districtCode;
    } else {
        //if search is by pincode
        var pinCode = document.getElementById("pin").value;
        url = url + "calendarByPin?pincode=" + pinCode;
    }
    if (!document.getElementById("radio-district").checked) {
        searchByDistrict = false;
    }
    url = url + "&date=" + date;
    return url;
}

function httpGet(url) {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open("GET", url, false); // false for synchronous request
    xmlHttp.send(null);
    return xmlHttp.responseText;
}

var sleepNow = (delay) => new Promise((resolve) => setTimeout(resolve, delay))