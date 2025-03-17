import express from "express";
import { createConnection } from "mysql";
import oracledb from "oracledb";
import cors from "cors";
import multer from "multer";
import path from "path";
import os from "os";

const app = express();

const loanPersonnel = [
    "acct_fund",
    "ao_fund",
    "ad_fund",
    "dc",
    "compt",
    "dc_audit",
    "acct_fund",
    "ao_fund",
    "ad_fund",
    "dc",
    "compt",
    "dc_audit",
    "acct_fund",
    "ad_fund",
    "compt",
    "acct_fund",
    "ao_fund",
    "ad_fund",
    "dc",
    "compt",
    "dc_audit",
    "acct_cash",
    "acct_fund",
];

const db = createConnection({
    host: "localhost",
    user: "root",
    password: "a1234A@#",
    database: "consumer_loan",
});

let clientOpts = {};

if (os.platform() === "win32") {
    // Windows-specific path
    clientOpts = { libDir: "C:\\oracle\\instantclient_23_7" };
} else if (os.platform() === "linux") {
    // Linux-specific path
    clientOpts = { libDir: "/usr/lib/oracle/23/client64/lib" };
}

// clientOpts = { libDir: "/usr/lib/oracle/23/client64/lib" };

oracledb.initOracleClient(clientOpts);

oracledb.autoCommit = true;

oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

async function run(query, data) {
    const connection = await oracledb.getConnection({
        user: "CASHSECTION",
        password: "c@shFlow",
        connectString:
            "(DESCRIPTION = (ADDRESS_LIST = (ADDRESS =  (PROTOCOL = TCP)(HOST = 172.16.0.115)(PORT = 1521)))(CONNECT_DATA =  (SERVICE_NAME = iis)))",
    });

    var result = "";

    if (data == undefined) {
        result = await connection.execute(query);
    } else {
        result = await connection.execute(query, data);
    }

    return result.rows;
}

app.use(express.json());

app.use(
    cors({
        origin: true,
        methods: ["GET", "POST", "PUT"],
        credentials: true,
    })
);

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        return cb(null, "public/images/");
    },

    filename: (req, file, cb) => {
        return cb(
            null,
            file.fieldname.toLocaleLowerCase() +
                "_" +
                Date.now() +
                path.extname(file.originalname)
        );
    },
});

const upload = multer({ storage });

app.get("/", (req, res) => {
    res.json("Hello! This is backend.");
});

// READ DATABASE - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

app.post("/application_login", (req, res) => {
    const id = req.body.BUETID;
    const dob = req.body.DATE_OF_BIRTH;

    const q =
        "SELECT * FROM EMPLOYEE WHERE EMPLOYEE_ID = '" +
        id +
        "' AND DATE_OF_BIRTH = TO_DATE('" +
        dob +
        "','MM/DD/YYYY')";

    run(q)
        .then((dbres) => {
            res.json(dbres);
        })
        .catch((dberr) => {
            console.log("read - /application_login - EMPLOYEE");
            res.send(dberr);
        });
});

app.post("/pay_valid", (req, res) => {
    const id = req.body.EMPLOYEEID;

    const curr_date = new Date();

    let curr_year = curr_date.getFullYear();
    let curr_month = curr_date.getMonth();

    if (curr_month == 0) {
        curr_year--;
        curr_month = 12;
    }

    const q =
        "SELECT * FROM PAY_SLIP WHERE EMPLOYEEID = '" +
        id +
        "' AND YEAR = " +
        curr_year +
        " AND MONTH = " +
        curr_month +
        "";

    run(q)
        .then((dbres) => {
            res.json(dbres);
        })
        .catch((dberr) => {
            console.log("read - /pay_valid - PAY_SLIP");
            res.send(dberr);
        });
});

app.post("/salary", (req, res) => {
    const id = req.body.SALARY_ID;

    const year = new Date().getFullYear();

    const month = new Date().getMonth();

    var q = "";

    if (month > 2)
        q =
            "SELECT * FROM PAY_SLIP WHERE EMPLOYEEID = '" +
            id +
            "' AND YEAR = '" +
            year +
            "' AND MONTH IN (" +
            month +
            ", " +
            (month - 1) +
            ", " +
            (month - 2) +
            ")";
    else if (month == 2) {
        q =
            "SELECT * FROM PAY_SLIP WHERE EMPLOYEEID = '" +
            id +
            "' AND ((YEAR = '" +
            year +
            "' AND MONTH IN ('" +
            month +
            "', '" +
            (month - 1) +
            "')) OR (YEAR = '" +
            (year - 1) +
            "' AND MONTH = 12))";
    } else if (month == 1) {
        q =
            "SELECT * FROM PAY_SLIP WHERE EMPLOYEEID = '" +
            id +
            "' AND ((YEAR = '" +
            year +
            "' AND MONTH IN ('" +
            month +
            "')) OR (YEAR = '" +
            (year - 1) +
            "' AND MONTH IN (11, 12)))";
    } else {
        q =
            "SELECT * FROM PAY_SLIP WHERE EMPLOYEEID = '" +
            id +
            "' AND YEAR = '" +
            (year - 1) +
            "' AND MONTH IN (10, 11, 12)";
    }

    run(q)
        .then((dbres) => {
            res.json(dbres);
        })
        .catch((dberr) => {
            console.log("read - /salary - PAY_SLIP");
            res.send(dberr);
        });
});

app.post("/loan", (req, res) => {
    const id = req.body.EMPLOYEEID;

    const q =
        "SELECT * FROM EMPLOYEE_LOAN WHERE EMPLOYEEID = '" +
        id +
        "' AND REMAINING_AMOUNT > 0";

    run(q)
        .then((dbres) => {
            res.json(dbres);
        })
        .catch((dberr) => {
            console.log("read - /loan - EMPLOYEE_LOAN");
            res.send(dberr);
        });
});

app.post("/loan_with_type", (req, res) => {
    const id = req.body.EMPLOYEEID;
    const loan_type = req.body.LOAN_TYPE;

    var q = "";

    if (loan_type === undefined) {
        q =
            "SELECT * FROM EMPLOYEE_LOAN INNER JOIN LOAN_TYPE ON EMPLOYEE_LOAN.LOAN_TYPE_ID = LOAN_TYPE.LOAN_TYPE_ID WHERE EMPLOYEE_LOAN.EMPLOYEEID = '" +
            id +
            "' AND EMPLOYEE_LOAN.REMAINING_AMOUNT > 0";
    } else {
        q =
            "SELECT * FROM EMPLOYEE_LOAN INNER JOIN LOAN_TYPE ON EMPLOYEE_LOAN.LOAN_TYPE_ID = LOAN_TYPE.LOAN_TYPE_ID WHERE EMPLOYEE_LOAN.EMPLOYEEID = '" +
            id +
            "' AND LOAN_TYPE.LOAN_TYPE_NAME LIKE '%" +
            loan_type +
            "%'";
    }

    run(q)
        .then((dbres) => {
            res.json(dbres);
        })
        .catch((dberr) => {
            console.log("read - /loan_with_type - EMPLOYEE_LOAN");
            res.send(dberr);
        });
});

app.get("/loan_type", (req, res) => {
    const q = "SELECT * FROM LOAN_TYPE";

    run(q)
        .then((dbres) => {
            res.json(dbres);
        })
        .catch((dberr) => {
            console.log("read - /loan_type - LOAN_TYPE");
            res.send(dberr);
        });
});

app.post("/personeel_login", (req, res) => {
    const userId = req.body.USER_ID;
    const password = req.body.PASSWORD;

    var q = "";

    if (password == undefined) {
        q = "SELECT * FROM PERSONNEL_LOGIN WHERE USER_ID = '" + userId + "'";
    } else {
        q =
            "SELECT * FROM PERSONNEL_LOGIN WHERE USER_ID = '" +
            userId +
            "' AND PASSWORD = '" +
            password +
            "'";
    }

    run(q)
        .then((dbres) => {
            res.json(dbres);
        })
        .catch((dberr) => {
            console.log("read - /personeel_login - PERSONNEL_LOGIN");
            res.send(dberr);
        });
});

app.post("/processing_loan_info", (req, res) => {
    const loan_type = req.body.LOAN_TYPE;

    const q =
        "SELECT * FROM PROCESSING_LOAN_INFO WHERE LOAN_TYPE = '" +
        loan_type +
        "' ORDER BY LOAN_ID DESC";

    run(q)
        .then((dbres) => {
            res.json(dbres);
        })
        .catch((dberr) => {
            console.log("read - /processing_loan_info - PROCESSING_LOAN_INFO");
            res.send(dberr);
        });
});

app.post("/processing_loan_info_with_emp_id", (req, res) => {
    const salary_id = req.body.SALARY_ID;
    const loan_type = req.body.LOAN_TYPE;

    var q = "";

    if (loan_type === undefined) {
        q =
            "SELECT * FROM PROCESSING_LOAN_INFO WHERE SALARY_ID = '" +
            salary_id +
            "'";
    } else {
        q =
            "SELECT * FROM PROCESSING_LOAN_INFO WHERE SALARY_ID = '" +
            salary_id +
            "' AND LOAN_TYPE = '" +
            loan_type +
            "'";
    }

    run(q)
        .then((dbres) => {
            res.json(dbres);
        })
        .catch((dberr) => {
            console.log(
                "read - /processing_loan_info_with_emp_id - PROCESSING_LOAN_INFO"
            );
            res.send(dberr);
        });
});

app.post("/processing_loan_id_filter", (req, res) => {
    const loan_id = req.body.LOAN_ID;
    const loan_type = req.body.LOAN_TYPE;

    var q = "";

    if (loan_type === undefined) {
        q =
            "SELECT * FROM PROCESSING_LOAN_INFO WHERE LOAN_ID = '" +
            loan_id +
            "'";
    } else {
        q =
            "SELECT * FROM PROCESSING_LOAN_INFO WHERE LOAN_ID LIKE '%" +
            loan_id +
            "%' AND LOAN_TYPE = '" +
            loan_type +
            "' ORDER BY LOAN_ID DESC";
    }

    run(q)
        .then((dbres) => {
            res.json(dbres);
        })
        .catch((dberr) => {
            console.log(
                "read - /processing_loan_id_filter - PROCESSING_LOAN_INFO"
            );
            res.send(dberr);
        });
});

app.post("/processing_app_nam_filter", (req, res) => {
    const app_nam = req.body.EMPLOYEE_NAME;
    const loan_type = req.body.LOAN_TYPE;

    const q =
        "SELECT * FROM PROCESSING_LOAN_INFO WHERE EMPLOYEE_NAME LIKE '%" +
        app_nam +
        "%' AND LOAN_TYPE = '" +
        loan_type +
        "' ORDER BY LOAN_ID DESC";

    run(q)
        .then((dbres) => {
            res.json(dbres);
        })
        .catch((dberr) => {
            console.log(
                "read - /processing_app_nam_filter - PROCESSING_LOAN_INFO"
            );
            res.send(dberr);
        });
});

app.post("/processing_loan_salary", (req, res) => {
    const loan_id = req.body.LOAN_ID;

    const q =
        "SELECT * FROM PROCESSING_LOAN_SALARY WHERE LOAN_ID = '" +
        loan_id +
        "'";

    run(q)
        .then((dbres) => {
            res.json(dbres);
        })
        .catch((dberr) => {
            console.log(
                "read - /processing_loan_salary - PROCESSING_LOAN_SALARY"
            );
            res.send(dberr);
        });
});

app.post("/processing_loan_prev_loan_1", (req, res) => {
    const loan_id = req.body.LOAN_ID;

    const q =
        "SELECT * FROM PROCESSING_LOAN_PREV_LOAN_1 WHERE LOAN_ID = '" +
        loan_id +
        "'";

    run(q)
        .then((dbres) => {
            res.json(dbres);
        })
        .catch((dberr) => {
            console.log(
                "read - /processing_loan_prev_loan_1 - PROCESSING_LOAN_PREV_LOAN_1"
            );
            res.send(dberr);
        });
});

app.post("/processing_loan_prev_loan_2", (req, res) => {
    const loan_id = req.body.LOAN_ID;

    const q =
        "SELECT * FROM PROCESSING_LOAN_PREV_LOAN_2 WHERE LOAN_ID = '" +
        loan_id +
        "'";

    run(q)
        .then((dbres) => {
            res.json(dbres);
        })
        .catch((dberr) => {
            console.log(
                "read - /processing_loan_prev_loan_2 - PROCESSING_LOAN_PREV_LOAN_2"
            );
            res.send(dberr);
        });
});

app.post("/processing_loan_remarks", (req, res) => {
    const loan_id = req.body.LOAN_ID;

    const q =
        "SELECT * FROM PROCESSING_LOAN_REMARKS WHERE LOAN_ID = '" +
        loan_id +
        "'";

    run(q)
        .then((dbres) => {
            res.json(dbres);
        })
        .catch((dberr) => {
            console.log(
                "read - /processing_loan_remarks - PROCESSING_LOAN_REMARKS"
            );
            res.send(dberr);
        });
});

app.post("/sanction_loan", (req, res) => {
    const loan_type = req.body.LOAN_TYPE;
    const loan_status = req.body.SANC_STATUS;

    var q = "";

    if (loan_status === undefined) {
        q =
            "SELECT * FROM PROCESSING_LOAN_SANCTION WHERE LOAN_TYPE = '" +
            loan_type +
            "'";
    } else {
        q =
            "SELECT * FROM PROCESSING_LOAN_SANCTION WHERE LOAN_TYPE = '" +
            loan_type +
            "' AND SANC_STATUS = '" +
            loan_status +
            "'";
    }

    run(q)
        .then((dbres) => {
            res.json(dbres);
        })
        .catch((dberr) => {
            console.log("read - /sanction_loan - PROCESSING_LOAN_SANCTION");
            res.send(dberr);
        });
});

app.post("/sanctioned_loan", (req, res) => {
    const loan_type = req.body.LOAN_TYPE;

    const q =
        "SELECT * FROM PROCESSING_LOAN_SANCTIONED WHERE LOAN_TYPE = '" +
        loan_type +
        "' AND SANCTION_STATUS = 'SANCTIONED'";

    run(q)
        .then((dbres) => {
            res.json(dbres);
        })
        .catch((dberr) => {
            console.log("read - /sanctioned_loan - PROCESSING_LOAN_SANCTIONED");
            res.send(dberr);
        });
});

app.post("/billed_loan", (req, res) => {
    const loan_type = req.body.LOAN_TYPE;

    const q =
        "SELECT * FROM PROCESSING_LOAN_BILLED WHERE LOAN_TYPE = '" +
        loan_type +
        "' AND BILL_STATUS = 'BILLED'";

    run(q)
        .then((dbres) => {
            res.json(dbres);
        })
        .catch((dberr) => {
            console.log("read - /billed_loan - PROCESSING_LOAN_BILLED");
            res.send(dberr);
        });
});

app.get("/account_list", (req, res) => {
    const q = "SELECT * FROM TAHBIL_NAME ORDER BY TAHBIL_NAME";

    run(q)
        .then((dbres) => {
            res.json(dbres);
        })
        .catch((dberr) => {
            console.log("read - /account_list - TAHBIL_NAME");
            res.send(dberr);
        });
});

app.post("/main_code_list", (req, res) => {
    const accountNo = req.body.ACCOUNT_NO;
    const q =
        "SELECT MAIN_CODE_NO, MAIN_CODE_DESCRIPTION, INC_EXP FROM TAHBIL_CODE_DESCRIPTION d WHERE ACCOUNT_NO = '" +
        accountNo +
        "' ORDER BY d.MAIN_CODE_NO";

    run(q)
        .then((dbres) => {
            res.json(dbres);
        })
        .catch((dberr) => {
            console.log("read - /code_list - TAHBIL_CODE_DESCRIPTION");
            res.send(dberr);
        });
});

app.post("/sub_code_list", (req, res) => {
    const accountNo = req.body.ACCOUNT_NO;
    const mainCodeNo = req.body.MAIN_CODE_NO;
    const q =
        "SELECT SUB_CODE_NO, SUB_CODE_DESCRIPTION, INC_EXP FROM TAHBIL_NAME_SUB_HEAD d WHERE ACCOUNT_NO = '" +
        accountNo +
        "' AND MAIN_CODE_NO = '" +
        mainCodeNo +
        "' ORDER BY d.SUB_CODE_NO";

    run(q)
        .then((dbres) => {
            res.json(dbres);
        })
        .catch((dberr) => {
            console.log("read - /code_list - TAHBIL_CODE_DESCRIPTION");
            res.send(dberr);
        });
});

app.get("/get_transaction_id", (req, res) => {
    const q =
        "SELECT MAX(TRANSACTION_ID) AS MAX_TRANSACTION_ID FROM TAHBIL_CASHBOOK";

    run(q)
        .then((dbres) => {
            res.json(dbres);
        })
        .catch((dberr) => {
            console.log("read - /get_transaction_id - TAHBIL_CASHBOOK");
            res.send(dberr);
        });
});

app.get("/get_unapproved_transaction", (req, res) => {
    const q =
        "SELECT a.TRANSACTION_ID, a.ACCOUNT_NO, a.ACCOUNT_NAME, a.MAIN_CODE_NO, b.MAIN_CODE_DESCRIPTION, a.SUB_CODE_NO, c.SUB_CODE_DESCRIPTION, a.VOUCHER_SCROLL_NO, a.VOUCHER_DESCRIPTION, a.VOUCHER_DATE, a.INCOME, a.EXPENSE, a.FIN_YEAR, a.ENTRY_DATE, a.ENTRY_USER, a.CHK_NO, a.CHK_DATE FROM TAHBIL_CASHBOOK a, TAHBIL_CODE_DESCRIPTION b, TAHBIL_NAME_SUB_HEAD c WHERE a.ACCOUNT_NO = b.ACCOUNT_NO AND b.ACCOUNT_NO = c.ACCOUNT_NO AND a.MAIN_CODE_NO = b.MAIN_CODE_NO AND b.MAIN_CODE_NO = c.MAIN_CODE_NO AND a.SUB_CODE_NO = c.SUB_CODE_NO AND a.APPROVED_USER IS NULL ORDER BY a.TRANSACTION_ID DESC";

    run(q)
        .then((dbres) => {
            res.json(dbres);
        })
        .catch((dberr) => {
            console.log("read - /get_unapproved_transaction - TAHBIL_CASHBOOK");
            res.send(dberr);
        });
});

app.post("/get_max_main_code", (req, res) => {
    const accountNo = req.body.ACCOUNT_NO;
    const q =
        "SELECT MAX(MAIN_CODE_NO) AS MAX_MAIN_CODE_NO FROM TAHBIL_CODE_DESCRIPTION WHERE ACCOUNT_NO = '" +
        accountNo +
        "' GROUP BY ACCOUNT_NO";

    run(q)
        .then((dbres) => {
            res.json(dbres);
        })
        .catch((dberr) => {
            console.log("read - /get_max_main_code - TAHBIL_CODE_DESCRIPTION");
            res.send(dberr);
        });
});

app.post("/get_max_sub_code", (req, res) => {
    const accountNo = req.body.ACCOUNT_NO;
    const mainCodeNo = req.body.MAIN_CODE_NO;
    const q =
        "SELECT MAX(SUB_CODE_NO) AS MAX_SUB_CODE_NO FROM TAHBIL_NAME_SUB_HEAD WHERE ACCOUNT_NO = '" +
        accountNo +
        "' AND MAIN_CODE_NO = '" +
        mainCodeNo +
        "' GROUP BY ACCOUNT_NO, MAIN_CODE_NO";

    run(q)
        .then((dbres) => {
            res.json(dbres);
        })
        .catch((dberr) => {
            console.log("read - /get_max_main_code - TAHBIL_CODE_DESCRIPTION");
            res.send(dberr);
        });
});

app.get("/get_total_income_expense", (req, res) => {
    // const accountNo = req.body.ACCOUNT_NO;
    const q = `SELECT 
                    B.MAIN_CODE_DESCRIPTION,  
                    SUM(A.INCOME) AS TOTAL_INCOME,
                    SUM(A.EXPENSE) AS TOTAL_EXPENSE
                FROM 
                    TAHBIL_CASHBOOK A
                JOIN 
                    TAHBIL_CODE_DESCRIPTION B 
                    ON A.ACCOUNT_NO = B.ACCOUNT_NO 
                    AND A.MAIN_CODE_NO = B.MAIN_CODE_NO
                WHERE 
                    A.APPROVED_USER IS NOT NULL  
                GROUP BY 
                    B.MAIN_CODE_DESCRIPTION`;

    run(q)
        .then((dbres) => {
            res.json(dbres);
        })
        .catch((dberr) => {
            console.log("read - /get_total_expense - TAHBIL_CASHBOOK");
            res.send(dberr);
        });
});

app.post("/get_total_expense", (req, res) => {
    const accountNo = req.body.ACCOUNT_NO;
    const q = `SELECT 
                    B.MAIN_CODE_DESCRIPTION,  
                    SUM(A.EXPENSE) AS TOTAL_EXPENSE
                FROM 
                    TAHBIL_CASHBOOK A
                JOIN 
                    TAHBIL_CODE_DESCRIPTION B 
                    ON A.ACCOUNT_NO = B.ACCOUNT_NO 
                    AND A.MAIN_CODE_NO = B.MAIN_CODE_NO
                WHERE 
                    A.APPROVED_USER IS NOT NULL AND A.ACCOUNT_NO = '${accountNo}' AND A.EXPENSE > 0
                GROUP BY 
                    B.MAIN_CODE_DESCRIPTION`;

    run(q)
        .then((dbres) => {
            res.json(dbres);
        })
        .catch((dberr) => {
            console.log("read - /get_total_expense - TAHBIL_CASHBOOK");
            res.send(dberr);
        });
});

app.get("/get_employee_compt_info", (req, res) => {
    // const accountNo = req.body.ACCOUNT_NO;
    const q = `SELECT A.EMPLOYEEID, A.EMPLOYEE_NAME, A.DESIGNATION, 
                B.SECTION_NAME, B.CONTACT_NO, B.MOBILE_NO, B.MAIL_ACC,
                B.PHOTO_LINK, B.ORDER_IN    
                FROM EMPLOYEE A
                INNER JOIN buetiis.compt_office B ON A.EMPLOYEEID = B.SALARYID
                WHERE A.OFFICE = 'COMPT' 
                AND A.CATEGORY = 'B' 
                AND A.SALARY_PAUSE = 0
                ORDER BY B.SECTION_CODE, B.ORDER_IN`;

    run(q)
        .then((dbres) => {
            res.json(dbres);
        })
        .catch((dberr) => {
            console.log("read - /get_employee_compt_info - EMPLOYEE");
            res.send(dberr);
        });
});

app.get("/get_notices", (req, res) => {
    // const accountNo = req.body.ACCOUNT_NO;
    const q = `SELECT * FROM WEB_NOTICE`;

    run(q)
        .then((dbres) => {
            res.json(dbres);
        })
        .catch((dberr) => {
            console.log("read - /get_notices - WEB_NOTICE");
            res.send(dberr);
        });
});

// CREATE DATABASE - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

app.post("/loan_register", (req, res) => {
    const loan_id = req.body.LOAN_ID;

    const q =
        "INSERT INTO PROCESSING_LOAN_INFO (LOAN_ID, EMPLOYEE_ID, SALARY_ID, APP_POS, EMPLOYEE_NAME, DESIGNATION, CATEGORY, OFFICE, BANK_ACCOUNT_NO, LOAN_TYPE, LOAN_AMOUNT, REASON_FOR_LOAN, LOAN_APP_DATE, DATE_OF_BIRTH, FATHER_NAME, MOTHER_NAME, NOMINEE_NAME, PRESENT_ADD, PERMANENT_ADD, NOMINEE_NID, APPOINTMENT_TYPE, DATE_FIRST_JOIN, NOMINEE_RELSHIP, TOTAL_SERVICE_PERIOD, DATE_OF_RETIREMENT, CONTACT_NO) VALUES (:0, :1, :2, :3, :4, :5, :6, :7, :8, :9, :10, :11, TO_DATE(:12,'MM/DD/YYYY'), TO_DATE(:13,'MM/DD/YYYY'), :14, :15, :16, :17, :18, :19, :20, TO_DATE(:21,'MM/DD/YYYY'), :22, :23, TO_DATE(:24,'MM/DD/YYYY'), :25)";

    var values = [
        loan_id,
        req.body.EMPLOYEE_ID,
        req.body.SALARY_ID,
        0,
        // req.files["PROFILE_PHOTO"][0].filename,
        // req.files["SIGN_IMG"][0].filename,
        req.body.EMPLOYEE_NAME,
        req.body.DESIGNATION,
        req.body.CATEGORY,
        req.body.OFFICE,
        req.body.BANK_ACCOUNT_NO,
        req.body.LOAN_TYPE,
        req.body.LOAN_AMNT,
        req.body.REASON_FOR_LOAN,
        req.body.LOAN_APP_DATE,
        req.body.DATE_OF_BIRTH,
        req.body.FATHERS_NAME,
        req.body.MOTHERS_NAME,
        req.body.NOMINEES_NAME,
        req.body.PRESENT_ADDRESS,
        req.body.PERMANENT_ADDRESS,
        req.body.NOMINEES_NID,
        req.body.APPOINTMENT_TYPE,
        req.body.DATE_FIRST_JOIN,
        req.body.NOMINEES_RELSHIP,
        req.body.SERV_PERIOD,
        req.body.DATE_OF_RETIREMENT,
        req.body.CONTACT_NO,
    ];

    run(q, values)
        .then((dbres) => {
            res.json(dbres);
        })
        .catch((dberr) => {
            console.log("create - /loan_register - PROCESSING_LOAN_INFO");
            res.send(dberr);
        });

    const sal_q =
        "INSERT INTO PROCESSING_LOAN_SALARY (LOAN_ID, LAST_MON_NAM, LAST_MON_BASIC_SAL, LAST_MON_TOTAL_SAL, LAST_MON_TOTAL_DEDUCT, LAST_MON_NET_SAL, LAST_2ND_MON_NAM, LAST_2ND_MON_BASIC_SAL, LAST_2ND_MON_TOTAL_SAL, LAST_2ND_MON_TOTAL_DEDUCT, LAST_2ND_MON_NET_SAL, LAST_3RD_MON_NAM, LAST_3RD_MON_BASIC_SAL, LAST_3RD_MON_TOTAL_SAL, LAST_3RD_MON_TOTAL_DEDUCT, LAST_3RD_MON_NET_SAL) VALUES (:0, :1, :2, :3, :4, :5, :6, :7, :8, :9, :10, :11, :12, :13, :14, :15)";

    var values = [loan_id];

    var temp = [].concat(...req.body.PREV_MON_SAL);

    values = [...values, ...temp];

    run(sal_q, values)
        .then((dbres) => {
            res.json(dbres);
        })
        .catch((dberr) => {
            console.log("create - /loan_register - PROCESSING_LOAN_SALARY");
            res.send(dberr);
        });

    const loan_1_q =
        "INSERT INTO PROCESSING_LOAN_PREV_LOAN_1 (LOAN_ID, HL_LOAN_AMNT, CL_LOAN_AMNT, LL_LOAN_AMNT, SBWSL_LOAN_AMNT, HL_INST_AMNT, CL_INST_AMNT, LL_INST_AMNT, SBWSL_INST_AMNT, HL_TOT_INST_NO, CL_TOT_INST_NO, LL_TOT_INST_NO, SBWSL_TOT_INST_NO, HL_REC_INST_NO, CL_REC_INST_NO, LL_REC_INST_NO, SBWSL_REC_INST_NO, HL_REM_INST_AMNT, CL_REM_INST_AMNT, LL_REM_INST_AMNT, SBWSL_REM_INST_AMNT) VALUES (:0, :1, :2, :3, :4, :5, :6, :7, :8, :9, :10, :11, :12, :13, :14, :15, :16, :17, :18, :19, :20)";

    values = [loan_id];

    temp = req.body.LOAN_DETAILS;

    for (let i = 0; i < temp.length; i++) {
        values = [...values, ...temp[i].slice(0, 4)];
    }

    run(loan_1_q, values)
        .then((dbres) => {
            res.json(dbres);
        })
        .catch((dberr) => {
            console.log(
                "create - /loan_register - PROCESSING_LOAN_PREV_LOAN_1"
            );
            res.send(dberr);
        });

    const loan_2_q =
        "INSERT INTO PROCESSING_LOAN_PREV_LOAN_2 (LOAN_ID, SBHL_LOAN_AMNT, OTH_LOAN_AMNT, SUM_LOAN_AMNT, SBHL_INST_AMNT, OTH_INST_AMNT, SUM_INST_AMNT, SBHL_TOT_INST_NO, OTH_TOT_INST_NO, SUM_TOT_INST_NO, SBHL_REC_INST_NO, OTH_REC_INST_NO, SUM_REC_INST_NO, SBHL_REM_INST_AMNT, OTH_REM_INST_AMNT, SUM_REM_INST_AMNT) VALUES (:0, :1, :2, :3, :4, :5, :6, :7, :8, :9, :10, :11, :12, :13, :14, :15)";

    values = [loan_id];

    temp = req.body.LOAN_DETAILS;

    for (let i = 0; i < temp.length; i++) {
        values = [...values, ...temp[i].slice(4, 7)];
    }

    run(loan_2_q, values)
        .then((dbres) => {
            res.json(dbres);
        })
        .catch((dberr) => {
            console.log(
                "create - /loan_register - PROCESSING_LOAN_PREV_LOAN_2"
            );
            res.send(dberr);
        });

    const remarks_q =
        "INSERT INTO PROCESSING_LOAN_REMARKS (LOAN_ID) VALUES (:0)";

    values = [loan_id];

    run(remarks_q, values)
        .then((dbres) => {
            res.json(dbres);
        })
        .catch((dberr) => {
            console.log("create - /loan_register - PROCESSING_LOAN_REMARKS");
            res.send(dberr);
        });
});

app.post("/sanction_register", (req, res) => {
    const q =
        "INSERT INTO PROCESSING_LOAN_SANCTION (LOAN_ID, EMPLOYEE_ID, SALARY_ID, EMPLOYEE_NAME, DESIGNATION, OFFICE, CATEGORY, LOAN_TYPE, DATE_OF_BIRTH, DATE_FIRST_JOIN, NET_SALARY, APPLY_AMOUNT, ALLOW_AMOUNT, SANCTION_AMOUNT, RECOVERY_AMOUNT, INSTALL_AMOUNT, TOTAL_INTEREST, INSTALL_NO, BANK_ACCOUNT_NO, SANC_STATUS, LOAN_APP_DATE, EMPLOYEE_BASIC, GROSS_SALARY, TOTAL_DEDUCTION) VALUES (:0, :1, :2, :3, :4, :5, :6, :7, TO_DATE(:8,'MM/DD/YYYY'), TO_DATE(:9,'MM/DD/YYYY'), :10, :11, :12, :13, :14, :15, :16, :17, :18, :19, TO_DATE(:20,'MM/DD/YYYY'), :21, :22, :23)";

    const values = [
        req.body.loan_id,
        req.body.buet_id,
        req.body.salary_id,
        req.body.applicant_name,
        req.body.designation,
        req.body.office_dept,
        req.body.category,
        req.body.loan_type,
        req.body.dob,
        req.body.joining_date,
        req.body.net_salary,
        req.body.app_amnt,
        req.body.prop_amnt,
        req.body.prop_amnt,
        req.body.recov_amnt,
        req.body.inst_amnt,
        req.body.tot_intest,
        req.body.tot_no_ins,
        req.body.account_no,
        "IN PROCESS",
        req.body.loan_app_date,
        req.body.basic_salary,
        req.body.gross_salary,
        req.body.deduct,
    ];

    run(q, values)
        .then((dbres) => {
            res.json(dbres);
        })
        .catch((dberr) => {
            console.log(
                "create - /sanction_register - PROCESSING_LOAN_SANCTION"
            );
            res.send(dberr);
        });
});

app.post("/sanctioning_loan", (req, res) => {
    const values = [
        req.body.LOAN_ID,
        req.body.LOAN_TYPE,
        req.body.APP_POS,
        req.body.SANC_DATE,
        req.body.SANCTION_STATUS,
        req.body.TOTAL_AMOUNT,
    ];

    const q =
        "INSERT INTO PROCESSING_LOAN_SANCTIONED (LOAN_ID, LOAN_TYPE, APP_POS, SANC_DATE, SANCTION_STATUS, TOTAL_AMOUNT) VALUES (:0, :1, :2, TO_DATE(:3,'MM/DD/YYYY'), :4, :5)";

    run(q, values)
        .then((dbres) => {
            res.json(dbres);
        })
        .catch((dberr) => {
            console.log(
                "create - /sanctioning_loan - PROCESSING_LOAN_SANCTIONED"
            );
            res.send(dberr);
        });
});

app.post("/bill_register", (req, res) => {
    const values = [
        req.body.LOAN_ID,
        req.body.LOAN_TYPE,
        req.body.APP_POS,
        req.body.BILL_DATE,
        req.body.BILL_STATUS,
        req.body.TOTAL_AMOUNT,
    ];

    const q =
        "INSERT INTO PROCESSING_LOAN_BILLED (LOAN_ID, LOAN_TYPE, APP_POS, BILL_DATE, BILL_STATUS, TOTAL_AMOUNT) VALUES (:0, :1, :2, TO_DATE(:3,'MM/DD/YYYY'), :4, :5)";

    run(q, values)
        .then((dbres) => {
            res.json(dbres);
        })
        .catch((dberr) => {
            console.log("create - /bill_register - PROCESSING_LOAN_BILLED");
            res.send(dberr);
        });
});

app.post("/final_loan_register", (req, res) => {
    var loan_ids = req.body.loan_id;

    if (loan_ids.length > 13) {
        loan_ids = loan_ids.split(", ");
    }

    const maxLoanIdQuery = "SELECT MAX(LOAN_ID) AS MAX_LOAN_ID FROM LOAN_INFO";

    run(maxLoanIdQuery)
        .then((dbres) => {
            const maxLoanId = Number(dbres[0]["MAX_LOAN_ID"]);
            let count = 0;
            loan_ids.map((loan_id) => {
                const sanc_query =
                    "SELECT * FROM PROCESSING_LOAN_SANCTION WHERE LOAN_ID = '" +
                    loan_id +
                    "'";

                run(sanc_query)
                    .then((dbres) => {
                        const values = [
                            maxLoanId + ++count,
                            dbres[0]["SALARY_ID"],
                            dbres[0]["EMPLOYEE_ID"],
                            dbres[0]["EMPLOYEE_NAME"],
                            dbres[0]["DESIGNATION"],
                            dbres[0]["OFFICE"],
                            dbres[0]["CATEGORY"],
                            new Date(
                                dbres[0]["DATE_FIRST_JOIN"]
                            ).toLocaleDateString("en-US"),
                            dbres[0]["BANK_ACCOUNT_NO"],
                            dbres[0]["EMPLOYEE_BASIC"],
                            dbres[0]["GROSS_SALARY"],
                            dbres[0]["NET_SALARY"],
                            dbres[0]["TOTAL_DEDUCTION"],
                            dbres[0]["APPLY_AMOUNT"],
                            dbres[0]["ALLOW_AMOUNT"],
                            dbres[0]["SANCTION_AMOUNT"],
                            dbres[0]["SANCTION_AMOUNT"],
                            dbres[0]["INSTALL_NO"],
                            dbres[0]["INSTALL_AMOUNT"],
                            dbres[0]["RECOVERY_AMOUNT"] -
                                dbres[0]["SANCTION_AMOUNT"],
                            new Date(dbres[0]["PAY_DATE"]).toLocaleDateString(
                                "en-US"
                            ),
                            dbres[0]["CHEQUE_NO"],
                            dbres[0]["LOAN_ID"],
                        ];

                        const q =
                            "INSERT INTO LOAN_INFO (LOAN_ID, SALARY_ID, EMPLOYEE_ID, EMPLOYEE_NAME, DESIGNATION, OFFICE, CATEGORY, DATE_FIRST_JOIN, BANK_ACCOUNT_NO, EMPLOYEE_BASIC, GROSS_SALARY, NET_SALARY, TOTAL_DEDUCTION, APPLIED_AMOUNT, ALLOW_AMOUNT, SANC_AMOUNT, BILL_AMOUNT, INS_NO, INS_AMOUNT, TOT_INTEREST, PAY_DATE, CHEQUE_NO, PRO_LOAN_ID) VALUES (:0, :1, :2, :3, :4, :5, :6, TO_DATE(:7,'MM/DD/YYYY'), :8, :9, :10, :11, :12, :13, :14, :15, :16, :17, :18, :19, TO_DATE(:20,'MM/DD/YYYY'), :21, :22)";

                        run(q, values)
                            .then((dbres) => {
                                res.json(dbres);
                            })
                            .catch((dberr) => {
                                console.log(
                                    "create - /final_loan_register - PROCESSING_LOAN_SANCTION"
                                );
                                res.send(dberr);
                            });
                    })
                    .catch((dberr) => {
                        console.log(
                            "create - /final_loan_register - LOAN_INFO"
                        );
                        res.send(dberr);
                    });
            });
        })
        .catch((dberr) => {
            console.log(
                "create - /final_loan_register - PROCESSING_LOAN_SANCTION"
            );
            res.send(dberr);
        });
});

app.post("/cash_book_insert", (req, res) => {
    const q =
        "INSERT INTO TAHBIL_CASHBOOK (TRANSACTION_ID, ACCOUNT_NO, ACCOUNT_NAME, MAIN_CODE_NO, SUB_CODE_NO, VOUCHER_DESCRIPTION, VOUCHER_SCROLL_NO, VOUCHER_DATE, EXPENSE, INCOME, ENTRY_DATE, FIN_YEAR, ENTRY_USER, CHK_NO, CHK_DATE) VALUES (:0, :1, :2, :3, :4, :5, :6, TO_DATE(:7,'MM/DD/YYYY'), :8, :9, TO_DATE(:10,'MM/DD/YYYY'), :11, :12, :13, TO_DATE(:14,'MM/DD/YYYY'))";

    const values = [
        req.body.TRANSACTION_ID,
        req.body.ACCOUNT_NO,
        req.body.ACCOUNT_NAME,
        req.body.MAIN_CODE_NO,
        req.body.SUB_CODE_NO,
        req.body.VOUCHER_DESCRIPTION,
        req.body.VOUCHER_SCROLL_NO,
        req.body.VOUCHER_DATE,
        req.body.EXPENSE,
        req.body.INCOME,
        req.body.ENTRY_DATE,
        req.body.FIN_YEAR,
        req.body.USER_NAME,
        req.body.CHEQUE_NO,
        req.body.CHEQUE_DATE,
    ];

    run(q, values)
        .then((dbres) => {
            res.json(dbres);
        })
        .catch((dberr) => {
            console.log("create - /cash_book_insert - TAHBIL_CASHBOOK");
            res.send(dberr);
        });
});

app.post("/add_main_code", (req, res) => {
    const values = [
        req.body.ACCOUNT_NO,
        req.body.ACCOUNT_NAME,
        req.body.MAIN_CODE_NO,
        req.body.MAIN_CODE_DESCRIPTION,
        req.body.INC_EXP,
    ];

    // console.log(values);

    const q =
        "INSERT INTO TAHBIL_CODE_DESCRIPTION (ACCOUNT_NO, ACCOUNT_NAME, MAIN_CODE_NO, MAIN_CODE_DESCRIPTION, INC_EXP) VALUES (:0, :1, :2, :3, :4)";

    run(q, values)
        .then((dbres) => {
            res.json(dbres);
        })
        .catch((dberr) => {
            console.log("create - /add_main_code - TAHBIL_CODE_DESCRIPTION");
            res.send(dberr);
        });
});

app.post("/add_sub_code", (req, res) => {
    const values = [
        req.body.ACCOUNT_NO,
        req.body.MAIN_CODE_NO,
        req.body.SUB_CODE_NO,
        req.body.SUB_CODE_DESCRIPTION,
        req.body.INC_EXP,
    ];

    const q =
        "INSERT INTO TAHBIL_NAME_SUB_HEAD (ACCOUNT_NO, MAIN_CODE_NO, SUB_CODE_NO,  SUB_CODE_DESCRIPTION, INC_EXP) VALUES (:0, :1, :2, :3, :4)";

    run(q, values)
        .then((dbres) => {
            res.json(dbres);
        })
        .catch((dberr) => {
            console.log("create - /add_main_code - TAHBIL_CODE_DESCRIPTION");
            res.send(dberr);
        });
});

// UPDATE DATABASE - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

app.put("/processing_loan_remarks_update", (req, res) => {
    var new_app_status = Number(req.body.REMARKER);

    const nap = '"' + new_app_status + '_"';

    var loan_id = req.body.LOAN_ID;

    var q = "";

    if (loan_id.length > 13) {
        loan_id = loan_id.split(", ");
        loan_id = "'" + loan_id.join("', '") + "'";
        q =
            "UPDATE PROCESSING_LOAN_REMARKS SET " +
            nap +
            " = '" +
            req.body.REMARKS +
            "' WHERE LOAN_ID IN (" +
            loan_id +
            ")";
    } else {
        q =
            "UPDATE PROCESSING_LOAN_REMARKS SET " +
            nap +
            " = '" +
            req.body.REMARKS +
            "' WHERE LOAN_ID IN ('" +
            loan_id +
            "')";
    }

    run(q)
        .then((dbres) => {
            res.json(dbres);
        })
        .catch((dberr) => {
            console.log(
                "update - /processing_loan_remarks_update - PROCESSING_LOAN_REMARKS"
            );
            res.send(dberr);
        });

    new_app_status++;

    var q2 = "";
    loan_id = req.body.LOAN_ID;

    if (loan_id.length > 13) {
        loan_id = loan_id.split(", ");
        loan_id = "'" + loan_id.join("', '") + "'";
        q2 =
            "UPDATE PROCESSING_LOAN_INFO SET APP_POS = " +
            new_app_status +
            " WHERE LOAN_ID IN (" +
            loan_id +
            ")";
    } else {
        q2 =
            "UPDATE PROCESSING_LOAN_INFO SET APP_POS = " +
            new_app_status +
            " WHERE LOAN_ID IN ('" +
            loan_id +
            "')";
    }

    run(q2)
        .then((dbres) => {
            res.json(dbres);
        })
        .catch((dberr) => {
            console.log(
                "update - /processing_loan_remarks_update - PROCESSING_LOAN_INFO"
            );
            res.send(dberr);
        });
});

app.put("/sanction", (req, res) => {
    var loan_id = req.body.loan_id;
    var cheque_no = req.body.cheque_no;
    var pay_date = req.body.pay_date;

    var q = "";

    if (loan_id.length > 13) {
        loan_id = loan_id.split(", ");
        loan_id = "'" + loan_id.join("', '") + "'";
    }

    if (cheque_no == undefined) {
        q =
            "UPDATE PROCESSING_LOAN_SANCTION SET SANC_STATUS = '" +
            req.body.status +
            "' WHERE LOAN_ID IN (" +
            loan_id +
            ")";
    } else {
        q =
            "UPDATE PROCESSING_LOAN_SANCTION SET SANC_STATUS = '" +
            req.body.status +
            "', CHEQUE_NO = '" +
            cheque_no +
            "', PAY_DATE = TO_DATE('" +
            pay_date +
            "', 'MM/DD/YYYY') WHERE LOAN_ID IN (" +
            loan_id +
            ")";
    }

    run(q)
        .then((dbres) => {
            res.json(dbres);
        })
        .catch((dberr) => {
            console.log("update - /sanction - PROCESSING_LOAN_SANCTION");
            res.send(dberr);
        });
});

app.put("/sanctioned", (req, res) => {
    var loan_id = req.body.LOAN_ID;
    var sanc_status = req.body.SANCTION_STATUS;

    var app_pos = Number(req.body.APP_POS);

    loan_id = "'" + loan_id + "'";

    app_pos++;

    var q =
        "UPDATE PROCESSING_LOAN_SANCTIONED SET APP_POS = '" +
        app_pos +
        "', SANCTION_STATUS = '" +
        sanc_status +
        "' WHERE LOAN_ID IN (" +
        loan_id +
        ")";

    run(q)
        .then((dbres) => {
            res.json(dbres);
        })
        .catch((dberr) => {
            console.log("update - /sanctioned - PROCESSING_LOAN_SANCTIONED");
            res.send(dberr);
        });
});

app.put("/billed", (req, res) => {
    var loan_id = req.body.LOAN_ID;
    var bill_status = req.body.BILL_STATUS;

    var app_pos = Number(req.body.APP_POS);

    loan_id = "'" + loan_id + "'";

    app_pos++;

    var q =
        "UPDATE PROCESSING_LOAN_BILLED SET APP_POS = '" +
        app_pos +
        "', BILL_STATUS = '" +
        bill_status +
        "' WHERE LOAN_ID IN (" +
        loan_id +
        ")";

    run(q)
        .then((dbres) => {
            res.json(dbres);
        })
        .catch((dberr) => {
            console.log("update - /billed - PROCESSING_LOAN_BILLED");
            res.send(dberr);
        });
});

app.put("/update_transaction", (req, res) => {
    const values = [
        req.body.TRANSACTION_ID,
        req.body.ACCOUNT_NO,
        req.body.ACCOUNT_NAME,
        req.body.MAIN_CODE_NO,
        req.body.SUB_CODE_NO,
        req.body.VOUCHER_DESCRIPTION,
        req.body.VOUCHER_SCROLL_NO,
        req.body.VOUCHER_DATE,
        req.body.EXPENSE,
        req.body.INCOME,
        req.body.ENTRY_DATE,
        req.body.FIN_YEAR,
        req.body.USER_NAME,
        req.body.CHEQUE_NO,
        req.body.CHEQUE_DATE,
    ];

    const q =
        "UPDATE TAHBIL_CASHBOOK SET TRANSACTION_ID = :0, ACCOUNT_NO = :1, ACCOUNT_NAME = :2, MAIN_CODE_NO = :3, SUB_CODE_NO = :4, VOUCHER_DESCRIPTION = :5, VOUCHER_SCROLL_NO = :6, VOUCHER_DATE = TO_DATE(:7,'MM/DD/YYYY'), EXPENSE = :8, INCOME = :9, ENTRY_DATE = TO_DATE(:10,'MM/DD/YYYY'), FIN_YEAR = :11, ENTRY_USER = :12, CHK_NO = :13, CHK_DATE = TO_DATE(:14,'MM/DD/YYYY') WHERE TRANSACTION_ID = :0";

    run(q, values)
        .then((dbres) => {
            res.json(dbres);
        })
        .catch((dberr) => {
            console.log("update - /update_transaction - TAHBIL_CASHBOOK");
            console.log(dberr);
            res.send(dberr);
        });
});

app.put("/update_approved_user", (req, res) => {
    const transId = req.body.TRANSACTION_ID;
    const userName = req.body.USERNAME;

    const q =
        "UPDATE TAHBIL_CASHBOOK SET APPROVED_USER = '" +
        userName +
        "' WHERE TRANSACTION_ID = '" +
        transId +
        "'";

    run(q)
        .then((dbres) => {
            res.json(dbres);
        })
        .catch((dberr) => {
            console.log("update - /update_approved_user - TAHBIL_CASHBOOK");
            res.send(dberr);
        });
});

//- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  - - - - - - -
app.put("/rejBack", (req, res) => {});

app.listen(8800, () => {
    console.log("Connected to Oracle backend! ");
});
