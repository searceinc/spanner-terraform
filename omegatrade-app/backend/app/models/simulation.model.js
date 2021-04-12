'user strict';
const database = require('./../config/database.js');
const { v4: uuidv4 } = require('uuid');
const Simulation = function () { };

Simulation.getAll = async function (cb) {
    try {
        const [result] = await database.run({ sql: 'select sml.sId as sId,sml.companyId as companyId, sml.status as status, cy.companyName as companyName, cy.companyShortCode as companyShortCode from simulations sml LEFT JOIN companies cy ON sml.companyId = cy.companyId LIMIT 3', json: true });
        cb(null, result)
    } catch (error) {
        cb(error, null)
    }
}

Simulation.findById = async function (param, cb) {
    try {
        const sId = param.sId
        const [ result ] = await database.run({
            sql: 'select sId,companyId,status from simulations where sId = @sId',
            params: {
                sId: sId
            },
            json: true
        });
        cb(null, result)
        
    } catch (error) {
        cb(error, null)
    }
}

Simulation.findByCompanyId = async function (companyId, sid) {
    try {
        const [result] = await database.run({
            sql: 'select sId,companyId,status from simulations where companyId = @companyId and sid = @sid',
            params: {
                companyId: companyId,
                sid: sid
            },
            json:true
        });
        return result;
    } catch (error) {
        throw ("ERROR:", error);
    }
}

Simulation.create = async function (companyId) {
    try {
        const sId = uuidv4();
        await database.table('simulations').insert({
            sId: sId,
            status: 'PROCESSING',
            createdAt: 'spanner.commit_timestamp()',
            companyId: companyId,
        });
        return sId;
    } catch (error) {
        throw ("ERROR:", error);
    }
};

Simulation.deleteById = async function (sId, cb) {
    try {
        const simulation = database.table('simulations');
        const result =  await simulation.deleteRows([sId]);
        cb(null, result)
    } catch (error) {
        cb(error, null);
    }
}

Simulation.updateById = async function (simulation) {
    const table = database.table('simulations');
    try {
        const [ result ] = await table.update([simulation]);
        return result;
    } catch (err) {
        console.log(err);
        throw new Error('Error update simulation by ID');
    }
}

module.exports = Simulation