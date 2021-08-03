const mysql = require('mysql');

const CREATE_TABLE = 'create table live_table(id int not null auto_increment, host varchar(100) not null, name varchar(100) not null, description varchar(250), client_id varchar(100), session_id varchar(100) not null, time timestamp not null default current_timestamp, likes int default 0, viewers int default 0, primary key(id));'

const connectionPool = mysql.createPool({
    connectionLimit     : 10,
    host                : 'localhost',
    user                : '******',	//User name
    password            : '******',	//Password
    database            : 'live_stream',
    waitForConnections  : true
});

function getConnection(cbk){
    connectionPool.getConnection(function(err, connection){
        if(err){
            throw err;
        }
        cbk(connection);
    });
}

function getAllLive(cbk){
    getConnection(function(connection){
        connection.query("SELECT * FROM LIVE_TABLE WHERE client_id IS NOT NULL ORDER BY name ASC", function(error, results, fields){
            connection.release();
            if(error){
                throw error;
            }
            var resultObj = results.map(function(data, index){
                return {
                    id : data.id,
                    host : data.host,
                    name : data.name,
                    description : data.description,
                    session_id : data.session_id,
                    client_id : data.client_id,
                    likes : data.likes,
                    viewers : data.viewers,
                    time : Date.parse(data.time)
                }
            });
            cbk(resultObj);
        });
    });
}

function getLiveBySessionId(session_id, cbk){
    getConnection(function(connection){
        connection.query("SELECT * FROM LIVE_TABLE WHERE session_id = ?", [session_id], function(error, results, fields){
            connection.release();
            if(error){
                throw error;
            }
            var resultObj = results.map(function(data, index){
                return {
                    id : data.id,
                    host : data.host,
                    name : data.name,
                    description : data.description,
                    session_id : data.session_id,
                    client_id : data.client_id,
                    likes : data.likes,
                    viewers : data.viewers,
                    time : Date.parse(data.time)
                }
            });
            cbk(resultObj[0]);
        });
    });
}

function postLive(data, cbk){
    var {host, name, description, session_id} = data;
    getConnection(function(connection){
        connection.query("INSERT INTO live_table(host, name, description, session_id) VALUES(?, ?, ?, ?)", [host, name, description, session_id], function(error, results, fields){
            connection.release();
            if(error){
                throw error;
            }
            cbk(results);
        });
    });
}

function updateClientId(data, cbk){
    var {session_id, client_id} = data;
    getConnection(function(connection){
        connection.query("UPDATE live_table SET client_id = ? WHERE session_id = ?", [client_id, session_id], function(error, results, fields){
            connection.release();
            if(error){
                throw error;
            }
            cbk(results);
        });
    });
}

function deleteLiveBySessionId(session_id, cbk){
    getConnection(function(connection){
        connection.query("DELETE FROM live_table WHERE session_id = ?", [session_id], function(error, results, fields){
            connection.release();
            if(error){
                throw error;
            }
            cbk(results);
        });
    });
}

function incrementLikeBySessionId(session_id, cbk){
    getConnection(function(connection){
        connection.query("UPDATE live_table SET likes = likes + 1 WHERE session_id = ?", [session_id], function(error, results, fields){
            connection.release();
            if(error){
                throw error;
            }
            cbk(results);
        });
    });
}

getConnection((connection) => {
    connection.query("CREATE DATABASE IF NOT EXISTS live_stream", function(error, results, fields){
        if(error){
            throw error;
        }
        connection.query("SHOW TABLES LIKE 'live_table'", function(error, results, fields){
            if(error){
                throw error;
            }
            if(results.length > 0){
                connection.release();
            }else{
                connection.query(CREATE_TABLE, function(error, results, fields){
                    if(error){
                        throw error;
                    }
                    connection.release();
                });
            }
        });
    });
});

exports.getAllLive = getAllLive;
exports.getLiveBySessionId = getLiveBySessionId;
exports.postLive = postLive;
exports.updateClientId = updateClientId;
exports.deleteLiveBySessionId = deleteLiveBySessionId;
exports.incrementLikeBySessionId = incrementLikeBySessionId;