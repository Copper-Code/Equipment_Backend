require('dotenv').config();
const cloudinary = require('cloudinary').v2; //ใช้สำหรับเชื่อมต่อและจัดการกับบริการ Cloudinary ในการอัปโหลดและจัดการรูปภาพ
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const app = express()
const fs = require('fs');
const path = require('path');





app.use(cors())
app.use(express.json());

const db = require('./util/util_database');
//check connect
(async()=>{
    try{
        const connection = await db.getConnection();
        console.log("Database Connected!");
        connection.release();
    }catch(error){
        console.error("Database Connection failed: ")
        console.error(error);
    }
})();

const console = require('console'); //ใช้สำหรับแสดงผลลัพธ์หรือข้อความต่างๆใน console ของ Node.js
const {
    reject
} = require('assert'); //ใช้สำหรับ reject Promise ในกรณีที่เกิด error ในการอัปโหลดรูปไปที่ Cloudinary

console.log("Test config Cloudinary URL:", process.env.CLOUDINARY_URL);
console.log(process.env.CLOUDINARY_URL)





app.get('/', (req, res) => {
    return res.json("From Backend side");
})

//Search eq_id ---- frontend ค้นหาจากเลขทะเบียน, ชื่อ, ผู้ดูแล  filter --> ปีงบ, สาขา, แผนก, สถานที่เก็บ,
// app.get('/search/:keyword', async (req, res) => { 
    app.get('/search', async (req, res) => {
        
    const keyword = req.query.keyword; //รับค่าจาก URL ที่ส่งมาจาก client เช่น /search?keyword=CN00000001 จะได้ eq_id = "CN00000001"
    if(!keyword){
        console.log("โปรดกรอกคำค้นหา: ", keyword);
        return res.status(400).json({error:"โปรดกรอกคำค้นหา"})
    };
    console.log("Search params:", req.params);
    console.log("Search keyword:", req.query.keyword);
    // const sql_search = `SELECT eq_id FROM  equipment WHERE eq_id LIKE ? LIMIT 30` //ใช้ LIKE เพื่อค้นหาข้อมูลที่มีเลขทะเบียนที่เริ่มต้นด้วยค่าที่ผู้ใช้กรอกเข้ามา และ LIMIT 10 เพื่อจำกัดผลลัพธ์ที่ส่งกลับไปยัง client ไม่เกิน 10 รายการ
    //   const [rows_search] = await db.query(sql_search,`${eq_id}%`);
    let sql_search = `SELECT * FROM equipment 
    WHERE eq_id LIKE ? 
    OR name_eq LIKE ? 
    OR user_eq LIKE ? 
    LIMIT 30`; //, [`${keyword}%`, `${keyword}%`, `${keyword}%`]
    console.log("Test keyword:", keyword);
    console.log("Test SQL Search Query:", sql_search);
    try{
      console.log("start try cath search");
      const [rows_search] = await db.query(sql_search, [
        `${keyword}%`,
        `${keyword}%`,
        `${keyword}%`]);
        console.log("Test try ค้นเจอข้อมูลที่ตรงกับคำค้นหา:", rows_search);
        res.status(200).json({data:rows_search});
    } catch (error) {
        res.status(404).json({error: error.message});
        console.log("Error in searching: ", req.params.keyword);
        console.error("Error in searching: ", error);
    }
});


// app.get("/search/:key",async (req,resp)=>{
//     let data = await Product.find(
//         {
//             "$or":[
//                 {name:{$regex:req.params.key}},
//                 {brand:{$regex:req.params.key}}
//             ]
//         }
//     )
//     resp.send(data);

// })





app.listen(5000)

//Multer for image upload
//จัดเก็บไฟล์โดยใช้โฟลเดอร์ uploads
// const storage = multer.diskStorage({

//     destination: (req, file, cb) => {
//         cb(null, "./uploads");
//         console.log("start multer storage")
//     },
//     filename: function (req, file, cb) {
//         const ext = file.mimetype.split("/")[1];
//         cb(null, `/${file.originalname}-${Date.now()}.${ext}`);
//         console.log("test multer storage", file);
//     }
// });
// const upload = multer({
//     storage: storage
// });
//CORS

//แก้ใหม่เป็น multer.memoryStorage() เพื่อให้ Multer เก็บไฟล์ในหน่วยความจำชั่วคราวแทนการบันทึกลงดิสก์
const storage = multer.memoryStorage();
//กำหนดขนาดไฟล์ที่อัปโหลดได้สูงสุดเป็น 5MB และอนุญาตเฉพาะไฟล์รูปภาพ (jpg, jpeg, png) เท่านั้น
const fileFilter = (req, file, cb) => {
    // ไฟล์ที่อนุญาต
    const allowedExtensions = /jpg|jpeg|png/;
    // MIME types ที่อนุญาต
    const allowedMimeTypes = /image\/jpeg|image\/png/;
    //เช็กนามสกุลไฟล์และ MIME type
    const extname = allowedExtensions.test(path.extname(file.originalname).toLowerCase());
    //เช็ก MIME type ของไฟล์
    const mimetype = allowedMimeTypes.test(file.mimetype); //ถ้าไฟล์มีนามสกุลและ MIME type ถูกต้องให้อนุญาตอัปโหลด ถ้าไม่ถูกต้องให้ส่ง error กลับไป
    if (extname && mimetype) { //ถ้าไฟล์มีนามสกุลและ MIME type ถูกต้องให้อนุญาตอัปโหลด ถ้าไม่ถูกต้องให้ส่ง error กลับไป
        return cb(null, true);
    } else {
        cb(new Error("Only image files (jpg,jpeg,png) are allowed!"));
    }
};

//


const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // จำกัดขนาดไฟล์ที่อัปโหลดได้สูงสุด 5MB
    }
});



app.use(cors({
    origin: true,
    methods: ["GET", "POST"],
    credentials: true,
}));

//Create
//ฟังก์ชันสร้าง eq_id อัตโนมัติแบบ Transaction-safe
async function generateEqId(conn, type_eq_id) {
    //1 ดึง prefix จาก type_equipment
    const [typeRows] = await conn.query(
        "SELECT type_eq_prefix FROM type_equipment WHERE type_eq_id=?",
        [type_eq_id]
    );
    if (typeRows.length === 0) {
        throw new Error("type_eq_id ไม่ถูกต้องหรือไม่มี type_eq_prefix");
    }
    const type_eq_prefix = typeRows[0].type_eq_prefix;

    //ดึงค่า ล่าสุดจาก eq_seq table พร้อม Lock Row
    const [seqRows] = await conn.query(
        "SELECT last_seq FROM eq_sequence WHERE type_eq_id = ? FOR UPDATE",
        [type_eq_id]
    );

    let nextSeq = 1
    if (seqRows.length === 0) {
        //ถ้ายังไม่มี seq --> สร้างใหม่
        await conn.query(
            "INSERT INTO eq_sequence(type_eq_id, last_seq) VALUES (?, ?)",
            [type_eq_id, 1]
        );
    } else {
        //ถ้ามี seq +1
        nextSeq = seqRows[0].last_seq + 1;

        await conn.query(
            "UPDATE eq_sequence SET last_seq = ? WHERE type_eq_id = ?",
            [nextSeq, type_eq_id]
        );
    }



    //ประกอบรหัส
    const padded = String(nextSeq).padStart(8, "0")
    const neweqID = type_eq_prefix + padded
    return neweqID;
}



app.post('/addEquipment', upload.single('upload_image'), async (req, res) => {
    //upload.single('upload_image') คือ middleware ของ multer ที่รับไฟล์จาก field ชื่อ upload_image แล้วประมวลผลและเก็บไฟล์ตาม storage ที่ตั้งไว้ พร้อมแนบข้อมูลไว้ที่ req.file
    console.log("start insert backend")
    console.log("TEST Multer")
    console.log(req.file)
    //อัปโหลดแบบ โฟลเดอร์ uploads
    // const upload_image = req.file ? req.file.filename : null;
    // const filePath = req.file ? req.file.path : null;


    //ขั้นตอนนี้คือการตรวจสอบว่ามีไฟล์แนบมาจาก client หรือไม่ ถ้ามีไฟล์จะอัปโหลดไปที่ Cloudinary 
    const type_eq_id = req.body.type_eq_id;
    const name_eq = req.body.name_eq;
    const brand_eq = req.body.brand_eq;
    const detail_eq = req.body.detail_eq;
    const serialNo = req.body.serialNo;
    const fiscal_year = req.body.fiscal_year;
    const order_date = req.body.order_date || null;
    const received_date = req.body.received_date || null;
    const company_eq = req.body.company_eq;
    const price_eq = req.body.price_eq;
    const po_eq = req.body.po_eq;
    const warranty_expire = req.body.warranty_expire || null;
    const note_eq = req.body.note_eq;
    const id_department = req.body.id_department;
    const user_eq = req.body.user_eq;
    const id_room = req.body.id_room;
    const id_status_eq = req.body.id_status_eq;
    console.log("Name", name_eq);
    console.log("Type", type_eq_id);
    console.log("order_date", order_date);
    console.log("received_date", received_date);
    console.log("warranty_expire", warranty_expire);


    if (
        !type_eq_id ||
        !name_eq ||
        !fiscal_year ||
        !order_date ||
        !received_date ||
        !company_eq ||
        !price_eq ||
        !po_eq ||
        !id_department ||
        !user_eq ||
        !id_room ||
        !id_status_eq) {

        // if (filePath && fs.existsSync(filePath)) { //
        //     fs.unlinkSync(filePath); //ลบไฟล์ทิ้งกรณีข้อมูลไม่ครบ
        // }

        return res.status(400).json({
            message: "กรอกข้อมูลไม่ครบ"
        });

    }
    //แก้เป็นอัปโหลดแบบ Cloudinary
    //อัปโหลดภาพไปที่ Cloudinary 
    let upload_image = null; //เก็บ URL ที่ได้จาก Cloudinary มาใส่ในตัวแปรนี้เพื่อส่งไปเก็บใน database
    let publicId = null; //เก็บ public_id ของ Cloudinary เผื่อไว้ใช้ลบรูปในอนาคต 
    if (req.file) { //ถ้ามีไฟล์แนบมาและนามสกุลถูกต้องให้ทำการอัปโหลดไปที่ Cloudinary
        const result = await new Promise((resolve, reject) => { //สร้าง Promise เพื่อรอผลการอัปโหลดจาก Cloudinary resovelve จะถูกเรียกเมื่ออัปโหลดสำเร็จ และ reject จะถูกเรียกเมื่อเกิด error ในการอัปโหลด
            const stream = cloudinary.uploader.upload_stream( //สร้าง stream สำหรับอัปโหลด
                {
                    folder: "Equipment_Images"
                }, //กำหนดโฟลเดอร์ใน Cloudinary ที่จะเก็บรูป
                (error, result) => { //callback ที่จะถูกเรียกหลังจากอัปโหลดเสร็จ
                    if (error) reject(error); //ถ้าเกิด error ให้ reject Promise ด้วย error นั้น
                    else resolve(result);
                } //ถ้าอัปโหลดสำเร็จให้ resolve Promise ด้วยผลลัพธ์ที่ได้จาก Cloudinary
            );
            stream.end(req.file.buffer);
        });
        upload_image = result.secure_url; //เก็บ URL ที่ได้จาก Cloudinary มาใส่ในตัวแปรนี้เพื่อส่งไปเก็บใน database
        publicId = result.public_id;

        console.log("Upload to Cloudinary successful. Image URL:", upload_image);
        console.log("Public ID:", publicId);
    }

    //ตรวจสอบนามสกุลไฟล์ที่อัปโหลดมา ถ้าไม่ใช่ jpg,jpeg,png ให้ลบไฟล์ทิ้งและส่ง error กลับไป

    // if (req.file&&!req.file.originalname.match(/\.(jpg|jpeg|png)$/i)) {
    // fs.unlinkSync(filePath); //ลบทิ้งกรณีนามสกุลผิด
    // console.log("Error in server post image")
    // console.log("นามสกุลไฟล์ผิด รับ jpg,jpeg,png เท่านั้น")
    // console.log("ลบไฟล์ที่นำเข้ามาแล้ว")
    // return res.status(400).json({
    //     message: "Only jpg,jpeg,png"
    // });
    // }




    const sql_data_eq = "INSERT INTO equipment(eq_id,type_eq_id,name_eq,brand_eq,detail_eq,serialNo,fiscal_year,order_date,received_date,company_eq,price_eq,po_eq,warranty_expire,note_eq,id_department,user_eq,id_room,id_status_eq) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)"
    const sql_image_eq = "INSERT INTO image_equipment (image_url,eq_id,public_id) VALUES (?,?,?)"


    let conn;

    try {
        conn = await db.getConnection();

        await conn.beginTransaction();
        const eq_id = await generateEqId(conn, type_eq_id);

        await conn.query(sql_data_eq, [eq_id, type_eq_id, name_eq, brand_eq, detail_eq, serialNo, fiscal_year, order_date, received_date, company_eq, price_eq, po_eq, warranty_expire, note_eq, id_department, user_eq, id_room, id_status_eq])

        // if (upload_image) {
        //     // if (!req.file.originalname.match(/\.(jpg|jpeg|png)$/i)) {
        //     //     throw new Error("Only image files (jpg,jpeg,png) are allowed!")
        //     // }

        //     //แบบจากโฟลเดอร์ uploads
        //     // await conn.query(sql_image_eq, [upload_image, eq_id]);
        //    

        // }


        //แก้เป็นอัปโหลดแบบ Cloudinary
        if (upload_image) {
            //แบบจาก Cloudinary
            await conn.query(sql_image_eq, [upload_image, eq_id, publicId]);
        }

        //ยืนยันข้อมูลลง Database (Commit)
        await conn.commit();

        const [showData] = await conn.query("select * from equipment WHERE eq_id = ?", [eq_id]);
        console.log("ข้อมูลบันทึกสำเร็จ :", showData);

        //ส่ง response กลับไปหา client แค่ครั้งเดียว
        res.status(201).json({
            message: "Success Insert Data" + (upload_image ? " and Image !" : "!"),
            data: showData
        });
    } catch (err) {
        console.error(err);

        //ถ้ามี Connection และเกิด Error ให้ Rollback ข้อมูลกลับ
        if (conn) await conn.rollback();

        //ลบไฟล์ทิ้งถ้า insert ข้อมูลลง db ไม่สำเร็จ
        // if (filePath && fs.existsSync(filePath)) {
        //     fs.unlinkSync(filePath);
        //     console.log("Error! File deleted!", filePath);
        // } 
        //ส่ง Error กลับไป
        res.status(500).send("ERROR Insert Data : " + err.message);
    } finally {
        if (conn) conn.release();
    }
});




app.get('/type_equipment', async (req, res) => {
    const sql_type_eq = `SELECT*FROM type_equipment`
    try {
        const [rows_type_eq] = await db.query(sql_type_eq);
        return res.json(rows_type_eq);
    } catch (err) {
        return res.status(500).json({
            Message: "Error inside server :type_equipment"
        })
    }
});


app.get('/branch', async (req, res) => {
    const sql_branch = `SELECT*FROM hospital_branch`
    try {
        const [rows_branch] = await db.query(sql_branch);
        return res.json(rows_branch);
    } catch {
        return res.status(500).json({
            Message: "Error inside server : branch"
        })
    }

});



app.get('/department/:DepartmentId', async (req, res) => {
    const {
        DepartmentId
    } = req.params;
    const sql_department = `SELECT*FROM department WHERE id_hp_branch=?`
    try {
        const [rows_department] = await db.query(sql_department, [DepartmentId])
        return res.json(rows_department);
    } catch {
        return res.status(500).json({
            Message: "Error inside server : department"
        })
    }
});



// API ดึงอาคารตามสาขา
app.get('/building/:branchId', async (req, res) => {
    const {
        branchId
    } = req.params;
    const sql_building = `SELECT*FROM hospital_building WHERE id_hp_branch=?`
    try {
        const [rows_building] = await db.query(sql_building, [branchId])
        return res.json(rows_building);
    } catch {
        return res.status(500).json({
            Message: "Error inside server : building"
        })
    }
});



// API ดึงชั้นตามอาคาร
app.get('/floor/:buildingId', async (req, res) => {
    const {
        buildingId
    } = req.params;
    const sql_floor = `SELECT * FROM hospital_floor WHERE id_building = ?`
    try {
        const [rows_floor] = await db.query(sql_floor, [buildingId])
        return res.json(rows_floor)
    } catch {
        return res.status(500).json({
            Message: "Error inside server : floor"
        })
    }
});

//API ดึงห้องตามชั้น

app.get('/room/:floorId', async (req, res) => {
    const {
        floorId
    } = req.params;
    const sql_room = `SELECT * FROM hospital_room WHERE id_floor = ?`
    try {
        const [rows_room] = await db.query(sql_room, [floorId])
        return res.json(rows_room)
    } catch {
        return res.status(500).json({
            Message: "Error inside server : floor"
        })
    }
});


//API ดึงภาพ

app.use('/', express.static(path.join(__dirname, '/'))); //ทำให้โฟลเดอร์uploadsสามารถเข้าถึงได้จากภายนอก

// app.get("/api/displayimage:id_image",async(req,res)=>{
//     const id_image = req.params.id_image;
//     const sqldisplayImg = "SELECT * FROM image_equipment WHERE id_image=?";
//     try{
//         const [rows] = await db.query(sqldisplayImg,[id_image]);
//         if(rows.length>0){
//             //ส่งชื่อไฟล์ หรือ พาธกลับไป
//             res.json({image:rows[0].image_url});
//         }else{
//             res.status(404).json({message:"Image not found"});
//         }
//     }catch(err){
//         console.log(err);
//         res.status
//     }
// })


//----------------------------------------------end create-----------------------------------------------
//---------------------------------------------update--------------------------------------------------

app.get('/edit_equipment/:eq_id', async (req, res) => {
    const {
        eq_id
    } = req.params;
    const conn = await db.getConnection();

    if (!eq_id) { //เช็คว่าผู้ใช้กรอกค่ามาจริงไหม

        return res.status(400).json({
            message: "โปรดกรอกเลขทะเบียนให้ถูกต้อง"
        })
    }


    // const selete_edit_eq = `SELECT * FROM equipment 
    //                         LEFT JOIN image_equipment
    //                         ON equipment.eq_id = image_equipment.eq_id
    //                         WHERE equipment.eq_id=?`

    const selete_edit_eq = `
    		SELECT e.eq_id,
            e.type_eq_id,
            type_equipment.type_name,
            e.name_eq,
            e.brand_eq,
            e.detail_eq,
            e.serialNo,
            e.fiscal_year,
            e.order_date,
            e.received_date,
            e.company_eq,
            e.price_eq,
            e.po_eq,
            e.warranty_expire,
            e.note_eq,
            e.id_department,
            e.user_eq,
            hospital_branch.id_hp_branch,
            hospital_building.id_building,
            hospital_floor.id_floor,
            e.id_room,
            hospital_room.name_room,
            e.id_status_eq,
            department.name_department,
            image.image_url
            FROM equipment as e
            LEFT JOIN image_equipment as image ON e.eq_id = image.eq_id
			JOIN department ON e.id_department = department.id_department
			JOIN hospital_room ON e.id_room = hospital_room.id_room
			JOIN hospital_floor ON hospital_room.id_floor = hospital_floor.id_floor
			JOIN hospital_building ON hospital_floor.id_building = hospital_building.id_building
			JOIN hospital_branch ON hospital_building.id_hp_branch = hospital_branch.id_hp_branch
			JOIN type_equipment ON e.type_eq_id = type_equipment.type_eq_id
			JOIN status_equipment ON e.id_status_eq = status_equipment.id_status_eq
            WHERE e.eq_id=?`
    try {
        const [rows_edit_eq] = await conn.query(selete_edit_eq, [eq_id]);
        // const [rows_edit_eq] = await conn.query(selete_edit_eq,[eq_id, type_eq_id, name_eq, brand_eq, detail_eq, serialNo, fiscal_year, order_date, received_date, company_eq, price_eq, po_eq, warranty_expire, note_eq, id_department, user_eq, id_room, id_status_eq]);
        return res.json(rows_edit_eq[0]);
    } catch {
        return res.status(500).json({
            Message: "Error inside server : Get Update"
        })
    } finally {
        conn.release(); //คืน conn 
    }

});

app.put('/update_equipment/:eq_id', upload.single('upload_image'), async (req, res) => {
    const {
        eq_id
    } = req.params;
    let conn = await db.getConnection();
    //check eq_id ว่าได้รับไหม
    if (!eq_id) { //เช็คว่าผู้ใช้กรอกค่ามาจริงไหม
        return res.status(400).json({
            message: "โปรดกรอกเลขทะเบียนให้ถูกต้อง"
        })
    }
    //รับจากฝั่งหน้าบ้านเก็บไว้ที่ data
    const data = [
        req.body.type_eq_id,
        req.body.name_eq,
        req.body.brand_eq,
        req.body.detail_eq,
        req.body.serialNo,
        req.body.fiscal_year,
        req.body.order_date || null,
        req.body.received_date || null,
        req.body.company_eq,
        req.body.price_eq,
        req.body.po_eq,
        req.body.warranty_expire || null,
        req.body.note_eq,
        req.body.id_department,
        req.body.user_eq,
        req.body.id_room,
        req.body.id_status_eq,
        eq_id
    ];

    // const upload_image = req.file ? req.file.filename : null;
    // const filePath = req.file ? req.file.path : null;


    if (
        !req.body.type_eq_id ||
        !req.body.name_eq ||
        !req.body.fiscal_year ||
        !req.body.order_date ||
        !req.body.received_date ||
        !req.body.company_eq ||
        !req.body.price_eq ||
        !req.body.po_eq ||
        !req.body.id_department ||
        !req.body.user_eq ||
        !req.body.id_room ||
        !req.body.id_status_eq) {

            //กรณีโฟลเดอร์ upload
        // if (filePath && fs.existsSync(filePath)) { //
        //     fs.unlinkSync(filePath); //ลบไฟล์ทิ้งกรณีข้อมูลไม่ครบ
        //     console.log("ลบไฟล์ทิ้งแล้ว");
        // }
        return res.status(400).json({
            message: "กรอกข้อมูลไม่ครบ"
        });
    }
 
   //แก้เป็นอัปโหลดแบบ Cloudinary
    //อัปโหลดภาพไปที่ Cloudinary 
    let upload_image = null; //เก็บ URL ที่ได้จาก Cloudinary มาใส่ในตัวแปรนี้เพื่อส่งไปเก็บใน database
    let publicId = null; //เก็บ public_id ของ Cloudinary เผื่อไว้ใช้ลบรูปในอนาคต 
    if (req.file) { //ถ้ามีไฟล์แนบมาและนามสกุลถูกต้องให้ทำการอัปโหลดไปที่ Cloudinary
        const result = await new Promise((resolve, reject) => { //สร้าง Promise เพื่อรอผลการอัปโหลดจาก Cloudinary resovelve จะถูกเรียกเมื่ออัปโหลดสำเร็จ และ reject จะถูกเรียกเมื่อเกิด error ในการอัปโหลด
            const stream = cloudinary.uploader.upload_stream( //สร้าง stream สำหรับอัปโหลด
                {
                    folder: "Equipment_Images"
                }, //กำหนดโฟลเดอร์ใน Cloudinary ที่จะเก็บรูป
                (error, result) => { //callback ที่จะถูกเรียกหลังจากอัปโหลดเสร็จ
                    if (error) reject(error); //ถ้าเกิด error ให้ reject Promise ด้วย error นั้น
                    else resolve(result);
                } //ถ้าอัปโหลดสำเร็จให้ resolve Promise ด้วยผลลัพธ์ที่ได้จาก Cloudinary
            );
            stream.end(req.file.buffer);
        });
        upload_image = result.secure_url; //เก็บ URL ที่ได้จาก Cloudinary มาใส่ในตัวแปรนี้เพื่อส่งไปเก็บใน database
        publicId = result.public_id;
        console.log("Success Upload to Cloudinary");
        console.log("New Image URL:", upload_image);
        console.log("New Public ID:", publicId);
    }

 //กรณีโฟลเดอร์ upload 
    // if (req.file && !req.file.originalname.match(/\.(jpg|jpeg|png)$/i)) {
    //     fs.unlinkSync(filePath); //ลบทิ้งกรณีนามสกุลผิด
    //     console.log("Error in server post image")
    //     console.log("นามสกุลไฟล์ผิด รับ jpg,jpeg,png เท่านั้น")
    //     console.log("ลบไฟล์ที่นำเข้ามาแล้ว")
    //     return res.status(400).json({
    //         message: "Only jpg,jpeg,png"
    //     });
    // }


    const sql_updateEquipment =
        `UPDATE equipment 
		SET	
            type_eq_id=?,
            name_eq=?,
            brand_eq=?,
            detail_eq=?,
            serialNo=?,
            fiscal_year=?,
            order_date=?,
            received_date=?,
            company_eq=?,
            price_eq=?,
            po_eq=?,
            warranty_expire=?,
            note_eq=?,
            id_department=?,
            user_eq=?,
            id_room=?,
            id_status_eq=?
            WHERE eq_id=?`; //อัปเดตข้อมูลทั่วไป


    const sql_updateImg = `UPDATE image_equipment SET image_url=?, public_id=? WHERE eq_id=?`; //อัปเดตรูป
    const selected_Img = `SELECT 1 FROM image_equipment  WHERE eq_id=? LIMIT 1`; //ค้นหาว่ามีรูปไหม
    const insert_image_eq = "INSERT INTO image_equipment (image_url,public_id,eq_id) VALUES (?,?,?)";//ถ้าไม่มี insertรูป
    // const [oldImg] = `SELECT public_id FROM image_equipment WHERE eq_id=?`;//ดึงค่าภาพเก่า
    try {
        await conn.beginTransaction();
        console.log("เริ่มต้น Transaction แล้ว");
        //1.ข้อมูลทั่วไป อัปเดตทุกกรณี
        const [rows_update_eq] = await conn.query(sql_updateEquipment, data);
        console.log("กรณี 1 อัปเดตข้อมูลทั่วไปทุกกรณีสำเร็จ");
        // const [rows_updateImg] = await conn.query(sql_updateImg,img)
        if (upload_image) { //checkว่ามีการอัปโหลดภาพมาไหม
            console.log("เริ่มต้นตรวจสอบการอัปโหลดภาพใหม่");
            // 2. เช็กว่ามีรูปเดิมไหม
            const [checkImg] = await conn.query(selected_Img, [eq_id]);
            console.log("checkImg :", checkImg)
            if (checkImg.length >= 1) {
                console.log("กรณี 2 พบรูปเก่าในระบบ กำลังดำเนินการลบและอัปเดตภาพใหม่");
                //ลบรูปเก่าทิ้งก่อนถ้ามี
                //ดึงค่าภาพเก่า
                const [oldImg] = await conn.query("SELECT public_id FROM image_equipment WHERE eq_id=?", [eq_id]);
               
                let oldPublicId = oldImg[0].public_id;
                console.log("oldPublicId :", oldPublicId);
                await cloudinary.uploader.destroy(oldImg[0].public_id);
                console.log("ลบรูปเก่าใน Cloudinary สำเร็จ publicId : ", oldPublicId);
                    //กรณีในโฟลเดอร์ uploads
                // await conn.query(sql_updateImg, [upload_image, eq_id]);
                await conn.query(sql_updateImg, [upload_image,publicId, eq_id]);
                console.log("อัปเดตรูปใหม่สำเร็จ pulicId : ",publicId);
            } else {
                console.log("กรณี 3 ไม่มีรูปเก่าในระบบ กำลังดำเนินการเพิ่มภาพใหม่");
                //3.ถ้าไม่มีรูปเก่าให้ insert รูปเพิ่ม
                await conn.query(insert_image_eq, [upload_image,publicId, eq_id]);
                
                console.log("เพิ่มรูปใหม่สำเร็จ publicId : ",publicId);
            }
        }
        //ยืนยันข้อมูลลง Database (Commit)
        await conn.commit();
        console.log("ผ่าน commit แล้ว");
        console.log("ก่อน return")
        // const [showData] = await conn.query("select * from equipment WHERE eq_id = ?", [eq_id]);
        // console.log("อัปเดตข้อมูลสำเร็จ :", showData);



        return res.json(rows_update_eq);




    } catch (error) {
        console.error(error);

        //ถ้ามี Connection และเกิด Error ให้ Rollback ข้อมูลกลับ
        if (conn) await conn.rollback();

        //กรณีโฟลเดอร์ upload ก่อนแก้เป็นอัปโหลดแบบ Cloudinary
        // //ลบไฟล์ทิ้งถ้า insert ข้อมูลลง db ไม่สำเร็จ
        // if (filePath && fs.existsSync(filePath)) {
        //     fs.unlinkSync(filePath);
        //     console.log("Error! File deleted!", filePath);
        // }

        //ลบไฟล์ทิ้งถ้า insert ข้อมูลลง db ไม่สำเร็จ กรณีอัปโหลดแบบ Cloudinary
        if(req.file && upload_image){ //ถ้ามีไฟล์แนบมาและอัปโหลดไปที่ Cloudinary สำเร็จแล้วให้ลบไฟล์ทิ้ง
             await cloudinary.uploader.destroy(publicId);
             console.log("Error! อัปเดตข้อมูลไม่สำเร็จ รูปที่อัปโหลดใหม่ถูกลบแล้ว publicId :", publicId);
        }


        //ส่ง Error กลับไป
        res.status(500).send("ERROR Update Data|put : " + error.message);
    } finally {
        if (conn) conn.release();
    }
});


//----------------------------------------------end update-----------------------------------------------



// try{
//     return res.status(200).json(
//         {Message:"Success UPDATE"}
//     )
// }catch{
//     return res.status(500).json({
//          Message: "Error inside server : Get Update"
//     })
// }






//----------------------------------------------Read----------------------------------------------------


//Read
app.get('/equipment', async (req, res) => {
    const sql_read = `
    SELECT 
    equipment.eq_id,
    equipment.name_eq,
    type_equipment.type_name,
    department.name_department,
    status_equipment.status_name_eq,
    po_eq,brand_eq,detail_eq,serialNo,fiscal_year,
    image_equipment.image_url,
CONCAT(
        DATE_FORMAT(order_date,'%d/%m/')
        ,
        YEAR(order_date)
) AS order_date,
CONCAT(
        DATE_FORMAT(received_date, '%d/%m/'),
        YEAR(received_date)
) AS received_date,

price_eq,
company_eq,
user_eq,

hospital_branch.name_hp_branch,

CONCAT(
    hospital_building.name_building,'  ',
    hospital_floor.name_floor,'  ',
    hospital_room.name_room
) AS storage_eq,

CONCAT(
timestampdiff(year,received_date,curdate()), ' ปี ',
timestampdiff(month,received_date,curdate())-(timestampdiff(year,received_date,curdate())*12), ' เดือน ',
timestampdiff(day,date_add(received_date,interval (timestampdiff(month,received_date,curdate())) month),curdate()), ' วัน '
) AS age_eq

FROM equipment
LEFT JOIN image_equipment ON equipment.eq_id = image_equipment.eq_id
JOIN department ON equipment.id_department = department.id_department
JOIN hospital_room ON equipment.id_room = hospital_room.id_room
JOIN hospital_floor ON hospital_room.id_floor = hospital_floor.id_floor
JOIN hospital_building ON hospital_floor.id_building = hospital_building.id_building
JOIN hospital_branch ON hospital_building.id_hp_branch = hospital_branch.id_hp_branch
JOIN type_equipment ON equipment.type_eq_id = type_equipment.type_eq_id
JOIN status_equipment ON equipment.id_status_eq = status_equipment.id_status_eq
ORDER BY updated_at DESC;
    `;
    try {
        const [rows] = await db.query(sql_read);
        return res.json(rows);
    } catch (err) {
        return res.status(500).json({
            Message: "Error inside api server"
        });

        // db.query(sql, (err, DataEquipment) => {
        //     if (err) return res.json({
        //         Message: "Error inside server"
        //     });
        //     return res.json(DataEquipment)
        // })
    }
})

// const sql_image_url=`SELECT eq_id
//                         FROM image_equipment
//                      WHERE eq_id=?`

//-------------------Delete----------------/
// db = connection ไปยังฐานข้อมูล
// query() = สั่ง รัน SQL
// sql_department = คำสั่งที่จะรัน
// [DepartmentId] = ค่าที่เอาไปแทน ?
// await = รอให้ฐานข้อมูลตอบกลับก่อน
app.delete('/delete_equipment/:eq_id', async (req, res) => {
    const {
        eq_id
    } = req.params;
    const conn = await db.getConnection();

    if (!eq_id) { //เช็คว่าผู้ใช้กรอกค่ามาจริงไหม

        return res.status(400).json({
            message: "โปรดกรอกเลขทะเบียนให้ถูกต้อง"
        })
    }
    //คำสั่งดึงพาธรูปจาก database ของ eq_id ที่จะลบในcloundinary
    const sql_image_url = `SELECT image_equipment.image_url,public_id 
                            FROM equipment 
                            INNER JOIN image_equipment
                            ON equipment.eq_id = image_equipment.eq_id
                            WHERE equipment.eq_id=?`;
    //Check ว่ามี eq_id ใน database ไหม                        
    const check_eq_id = `SELECT 1 FROM equipment WHERE eq_id = ? LIMIT 1;`
    //Check ว่ามีพาธรูปใน database ไหม
    const check_image = `SELECT 1 FROM equipment INNER JOIN image_equipment
ON equipment.eq_id = image_equipment.eq_id
WHERE equipment.eq_id=? LIMIT 1;`
    const delete_eq = `DELETE FROM equipment WHERE eq_id=?;`
    try {
        await conn.beginTransaction(); //เริ่ม transaction
        //เช็ค eq_id ว่าตรงกับฐานข้อมูลไหม
        const [rows_eq_id] = await conn.query(check_eq_id, [eq_id])
        //ถ้าไม่เจอ eq_id ให้ส่ง error กลับไป ถ้าเจอให้ทำต่อ
        if (rows_eq_id.length <= 0) {
            console.log("_______________________")
            console.log("ค้นไม่เจอ eq_id")
            return res.status(400).json({
                message: "ไม่พบ eq_id ในฐานข้อมูล"
            })
        } else if (rows_eq_id.length >= 1) {
            console.log("_______________________")
            console.log("ค้นเจอ eq_id : " + eq_id)
        }

        //เช็คว่ามีพาธรูปใน database ไหม
        const [rows_img] = await conn.query(check_image, [eq_id])
        //กรณี upload แบบ Cloudinary
        if (rows_img.length >= 1) {
            console.log("_______________________");
            console.log("ค้นเจอ Path รูปใน database");

  
            const [rows_path_img] = await conn.query(sql_image_url, [eq_id])
            //เช็ก public_id ก่อนว่ามีไหมถ้ามีให้ลบใน Cloudinary
            for (const item_img of rows_path_img) { //ดึง Paht ของ eq_id ทุกรูปที่มีจาก database
                const imagePath = item_img.image_url
                const publicId = item_img.public_id;
                console.log("Path จาก database" + imagePath);
                console.log("Public ID จาก database" + publicId);

                const resultPublicid = await cloudinary.api.resource(publicId);
                if(resultPublicid){
                console.log("พบรูปใน Coudinary", resultPublicid )
                //ถ้ามีรูปใน Cloudinary ให้ลบใน Cloudinary ก่อน
                await cloudinary.uploader.destroy(publicId);
                console.log("ลบรูปใน Cloudinary สำเร็จ publicId : ", publicId, " ต่อไปลบใน database");

                 } else {

                    console.log("ไม่พบไฟล์รูปใน Cloudinary", imagePath)
                }
            }

       // กรณีอัปโหลดรูปแบบ โฟลเดอร์ uploads
        // if (rows_img.length >= 1) {
        //     console.log("_______________________");
        //     console.log("ค้นเจอ Path รูปใน database");

        //     //ดึงพาธจาก database
        //     const [rows_path_img] = await conn.query(sql_image_url, [eq_id])
        //     for (const item_img of rows_path_img) { //ดึง Paht ของ eq_id ทุกรูปที่มีจาก database
        //         const imagePath = `./uploads${item_img.image_url}`
        //         console.log("Path จาก database" + imagePath);

        //         //เช็คว่ามีรูปในโฟลเดอร์ไหม
        //         if (fs.existsSync(imagePath)) {
        //             console.log("ค้นเจอรูปในโฟลเดอร์", imagePath);

        //             //ถ้าเจอให้ลบในโฟลเดอร์ก่อน
        //             await fs.promises.unlink(`./uploads${item_img.image_url}`);
        //             console.log("ลบรูปในโฟลเดอร์สำเร็จ");
        //         } else {

        //             console.log("ไม่พบไฟล์รูปในโฟลเดอร์", imagePath)
        //         }
        //     }
        } else {
            console.log("ไม่มีรูป")
        }

        //ลบข้อมูลใน database
        const [delete_eq_sql] = await conn.query(delete_eq, [eq_id])
        console.log("============================")
        console.log(`ลบทะเบียน ${eq_id} ครุภัณฑ์สำเร็จ`)
        await conn.commit(); //บันทึกจริง
        return res.status(200).json({
            Message: "Deleted!"
        })



    } catch (error) {
        await conn.rollback() //ถ้ามีอันไหนพังย้อนกลับทั้งหมด
        return res.status(500).json({
            Message: "Error inside server : Delete Equipment"
        })
    } finally {
        conn.release(); //คืน connection
    }
});

app.listen(8081, () => {
    console.log("listening 8081 เริ่มแล้วจ้า")
});