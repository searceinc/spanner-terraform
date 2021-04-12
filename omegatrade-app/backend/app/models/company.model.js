'user strict';
const database = require('./../config/database.js');
const Company = function () { };

Company.getAll = async function (cb) {
    try {
        const [ companies ] = await database.run({ sql: 'select companyId , companyName , companyShortCode , created_at from companies', json: true, });
        cb(null, companies)
    } catch (error) {
        cb(error, null)
    }
}

Company.create = async function (data, result) {
    try {
        await database.table('companies').insert(data);
        result(null, data.companyId);
    } catch (error) {
        result(error, null);
    }
};

Company.checkCompany = async function (companyName, companyShortCode) {
    try {
        const query = {
            sql: 'select companyName , companyShortCode from companies where companyName = @companyName or companyShortCode = @companyShortCode LIMIT 1',
            params: {
                companyName: companyName,
                companyShortCode: companyShortCode
            },
            json: true
        }
        return await database.run(query);
    } catch (error) {
        throw ("Error:", error);
    }
};

Company.delete = async function (companyId, cb) {
    try {
        const company = database.table('companies');
        const result =  await company.deleteRows([companyId]);
        cb(null, result)
    } catch (error) {
        cb(error, null);
    }
}

Company.update = async function (params, cb) {
    const table = database.table('companies');
    try {
        await table.update([params]);
        cb(null, true)
    } catch (err) {
        cb(err, null)
    }
}

Company.findById = async function (companyId) {
    try {
        const query = {
            sql: 'select * from companies where companyId = @companyId',
            params: {
                companyId: companyId,
            },
            json: true
        }
        return await database.run(query);
    } catch (error) {
        throw ("Error:", error);
    }
}

Company.createStockData = async function (stockData) {
    try {
        await database.table('companyStocks').insert(stockData)
        return true;
    } catch (error) {
        throw ("Error:", error);
    }
};

Company.getCompanySimulation = async function (companyId, sId = null) {
    try {
        const params = {
            companyId: companyId
        }
        let query;
        const fields = `companies.companyId,companies.companyName,companies.companyShortCode,`
        if (sId) {
            query = `SELECT ${fields} simulations.status,simulations.sId 
            FROM companies 
            LEFT JOIN simulations ON companies.companyId = simulations.companyId
            WHERE companies.companyId = @companyId and simulations.sId=@sId`
            params.sId = sId;
        } else {
            query = `select ${fields} 
            FROM companies 
            WHERE companyId = @companyId`;
        }
        const [result] = await database.run({
            sql: query,
            params: params,
            json: true
        });
        return result;
    } catch (error) {
        throw new Error('Error finding company simulation');
    }
};

Company.getStocks = async function (companyId, date = null) {
    try {
        let conditions = ['companyId = @companyId'];
        let values = {
            companyId: companyId
        };
        if (date) {
            conditions.push('date > @date');
            values.date = date;
        }
        const [stockResult] = await database.run({
            sql: `SELECT date , currentValue 
                  FROM companyStocks  
                  WHERE  ${conditions.join(' AND ')}  
                  ORDER BY date`,
            params: values,
            json: true
        });
        return stockResult;
    } catch (error) {
        throw new Error('Error finding stocks');
    }
}

module.exports = Company