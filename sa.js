var genTable = function(n, proposerTraits, proposeeTraits, $proposerTable, $proposeeTable) {
    var prprHead = "<thead><tr><th>Proposer</th><th>sort = function(a,b) {</th>", prpeHead = "<thead><tr><th>Proposee</th><th>sort = function(a,b) {</th>", prprBody = "<tbody>", prpeBody = "<tbody>";
    var prprEntry = '<th><textarea class="list-group-item" data-value="return a">return a</textarea></th>', prpeEntry = '<th><textarea class="list-group-item" data-value="return a">return a</textarea></th>';
    var pFoot = "<tfoot><th></th><th>}</th></tfoot>";

    for(var i = 0; i < proposerTraits; i++) {
        prprHead += '<th><input class="list-group-item" value="trait'+i+'"></input></th>';
        prprEntry += '<th><input class="list-group-item" value="0" type="number"></input></th>';
    }
    for(i = 0; i < proposeeTraits; i++) {
        prpeHead += '<th><input class="list-group-item" value="trait'+i+'"></input></th>';
        prpeEntry += '<th><input class="list-group-item" value="0" type="number"></input></th>';
    }

    prprHead += "</tr></thead>";
    prpeHead += "</tr></thead>";

    prprEntry += "</tr>";
    prpeEntry += "</tr>";

    for(i = 0; i < n; i++) {
        prprBody += "<tr><th>"+String.fromCharCode(i + 65)+prprEntry;
        prpeBody += "<tr><th>"+i+prpeEntry;
    }

    $proposerTable.html(prprHead + prprBody + pFoot);
    $proposeeTable.html(prpeHead + prpeBody + pFoot);

    $('textarea').on( 'blur' , function() 
    {
        var textarea = $( this );
        textarea.attr("data-value", textarea.val());
    });
}

var Simulation = function($curDayTable, $history, proposees, proposers) {
    this.$curDayTable = $curDayTable;
    this.$history = $history;
    this.proposees = proposees;
    this.proposers = proposers;
    this.day = 0;
    this.phase = 0;
    this.finished = 1;

    this.proposer = 0;
    this.proposee = 0;
}

Simulation.prototype.run = function(speed) {
    var self = this;
    self.step();
    this.timeInterval = setInterval(function() {
        self.step();
    }, speed);
}

Simulation.prototype.step = function() {
    switch(this.phase) {
        case 0: //proposing stage
            this.stepPropose();
            break;
        case 1: //choosing stage - TODO: refactor (never gets called)
            this.stepConsider();
            break;
        case 2: //finalizing
            if(this.finished === 1) {
                this.finish();
            } else {
                this.stepFinishDay();
            }
    }
}

Simulation.prototype.finish = function() {
    this.stop();
    uiFinishAll();
}

Simulation.prototype.stop = function() {
    clearInterval(this.timeInterval);
}

Simulation.prototype.stepPropose = function() {
    var proposer;
    if(proposer = this.proposers[this.proposer]) {
        uiAddProposer(proposer.priorityList[proposer.priorityList.length - 1], proposer, this.$curDayTable);
        proposer.priorityList[proposer.priorityList.length - 1].proposedList.push(proposer);
        this.proposer += 1;
    } else {
        this.proposer = 0;
        this.phase = 2;
        this.stepConsider();
    }
}

Simulation.prototype.stepConsider = function() {
    var proposees = this.proposees;
    for(i in proposees) {
        proposees[i].proposedList.sort(proposees[i].func);
        if(proposees[i].proposedList.length > 0) {
            uiChooseProposer(proposees[i], proposees[i].proposedList.pop(), this.$curDayTable);
            if(proposees[i].proposedList.length > 0) {
                this.finished = 0;
                proposees[i].proposedList.map(function(a) {
                    a.priorityList.pop();
                });
            }
        } else {
            this.finished = 0;
        }
        
        proposees[i].proposedList = [];
    }

    this.phase = 2;
}

Simulation.prototype.stepFinishDay = function() {
    uiFinishDay(this.day, this.$curDayTable, this.$history);
    this.day++;
    this.finished = 1;
    this.phase = 0;
}

//TODO: should probably organize these functions
var uiFinishAll = function() {
    alert("Finished!");
}

var uiFinishDay = function(curDay, $curDayTable, $history) {
    $history.append($curDayTable.clone().wrap("<div class='col-md-3'></div>").parent());

    for(var i = 1, row; row = $curDayTable[0].rows[i]; i++) {
        row.cells[1].innerHTML = "";
    }

    $curDayTable.find("thead")[0].rows[0].cells[0].innerHTML = "Day " + (curDay + 1);
}

var uiAddProposer = function(proposee, proposer, $curDayTable) {
    $curDayTable[0].rows[parseInt(proposee.id) + 1].cells[1].innerHTML += proposer.id;
}

var uiChooseProposer = function(proposee, proposer, $curDayTable) {
    $curDayTable[0].rows[parseInt(proposee.id) + 1].cells[1].innerHTML += "::" + proposer.id; //such hax
}

var genCurrentDayTable = function(n, day, $table) {
    var inner = "<tbody>";
    for(var i = 0; i < n; i++) {
        inner += "<tr><th>"+i+"</th><th></th></tr>";
    }
    inner += "</tbody>";

    $table.html("<thead><tr><th>Day "+day+"</th><th>Proposers</th></tr></thead>"+inner);
}

var parseTables = function($proposerTable, $proposeeTable) {
    var proposers = scrapeTable($proposerTable);
    var proposees = scrapeTable($proposeeTable);

    proposers = proposers.map(function(a) {
        a.priorityList = proposees.slice().sort(a.func);
        a.reject = function() {
            a.priorityList.pop();
        }
        return a;
    });
    proposees = proposees.map(function(a) {
        a.proposedList = [];
        return a;
    });

    console.log(proposers);
    console.log(proposees);

    return {
        proposers: proposers,
        proposees: proposees
    }
}

var getFunction = function(str) {
    return eval("(function() {return function(a,b) {"+str+"}; })()"); //TODO: Prepare 3 page defense for usage of eval
}

var scrapeTable = function($table) {
    var table = $table.find("tbody")[0];
    var header = $table.find("thead")[0];
    var list = [];

    for(var i = 0, row; row = table.rows[i]; i++) {
        listItem = {};

        listItem.id = row.cells[0].innerHTML;
        listItem.func = getFunction($(row.cells[1].children[0]).attr("data-value"));

        for(var j = 2, cell; cell = row.cells[j]; j++) {
            listItem[header.rows[0].cells[j].children[0].value] = parseFloat(cell.children[0].value);
        }

        list.push(listItem);
    }

    return list;
}

var init = function() {
    var instructionToggle = $("#instruction-toggle");
    var settingsToggle = $("#settings-toggle");
    var currentToggle = $("#current-toggle");
    var historyToggle = $("#history-toggle");

    var instructionDiv = $("#instruction");
    var settingsDiv = $("#settings");
    var currentDiv = $("#current");
    var historyDiv = $("#history");

    var prprTable = $("#proposer-table");
    var prpeTable = $("#proposee-table");

    var inpN = $("#inp-n");
    var inpPrpr = $("#inp-prpr-t");
    var inpPrpe = $("#inp-prpe-t");
    var inpSpeed = $("#inp-speed")

    var genTraitsBtn = $("#genTraits");
    var saveTraitsBtn = $("#saveTraits");
    var genRunBtn = $("#runTraits");
    var genStepBtn = $("#stepTraits");
    var genStopBtn = $("#stopTraits");

    var currentDayTable = $("#current-day-table");
    var historyTable = $("#history-div");

    var simulator;

    var genFunction = function(toggle, div) {
        return function() {
            if(toggle.html() === "+") {
                toggle.html("-");
                div.show();
            } else {
                toggle.html("+");
                div.hide();
            }
        }
    }

    genTraitsBtn.click(function() {
        genTable(inpN.val(), inpPrpr.val(), inpPrpe.val(), prprTable, prpeTable);
        genCurrentDayTable(inpN.val(), 0, currentDayTable);
        historyTable.html("");
    });

    genRunBtn.click(function() {
        if(simulator) {
            simulator.run(inpSpeed.val());
        }
    });

    genStepBtn.click(function() {
        if(simulator) {
            simulator.step();
        }
    });

    genStopBtn.click(function() {
        if(simulator) {
            simulator.stop();
        }
    });

    saveTraitsBtn.click(function() {
        data = parseTables(prprTable, prpeTable);
        simulator = new Simulation(currentDayTable, historyTable, data.proposees, data.proposers);
        alert("Saved!");
    });

    instructionToggle.click(genFunction(instructionToggle, instructionDiv));
    settingsToggle.click(genFunction(settingsToggle, settingsDiv));
    currentToggle.click(genFunction(currentToggle, currentDiv));
    historyToggle.click(genFunction(historyToggle, historyDiv));
}

$(document).ready(function() {
    init();
})