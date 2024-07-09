import { asyncHandler } from "../utils/asyncHandler.js";
import Order from "../models/order.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import Invoice from "../models/vatInvoice.model.js";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import sendInvoiceEmail from "../utils/sendInvoiceEmail.js";
import Customer from "../models/customer.model.js";


const addOrder = asyncHandler(async (req, res, next) => {
  const userId = req.user?._id;
  const { customer_id } = req.params;

  // Validate customer_id
  if (!isValidObjectId(customer_id)) {
    return next(new ApiError(400, "Invalid Customer ID"));
  }

  const {
    dateOfOrder,
    buildingAddress,
    orderType,
    orderValue,
    deposit,
    depositMethod,
    numberOfInstallments,
    dateOfFirstDd,
    customerAccountName,
    customerAccountNumber,
    customerSortCode,
    googleEmailRenewCampaign,
    customerSignature,
    renewalDate2024,
    numberOfKeyPhrase,
    numberOfKeyAreas,
    createdBy,
  } = req.body;

  // if (
  //   !customer_id ||
  //   !orderType ||
  //   !dateOfOrder ||
  //   !renewalDate2024 ||
  //   (orderType === "New Business" && (!numberOfKeyPhrase || !numberOfKeyAreas))
  // ) {
  //   return next(new ApiError(400, "Required fields are missing"));
  // }

  const orderValues = orderValue || 0;
  const deposits = deposit || 0;
  const numberOfInstallmentss = numberOfInstallments || 0;
  const safeNumberOfInstallments = numberOfInstallmentss || 1;

  const DdMonthly =
    safeNumberOfInstallments > 0
      ? (orderValues - deposits) / safeNumberOfInstallments
      : 0;
  const increase = 0.05 * orderValues;
  const expected2024OrderValue = orderValues + increase;
  const cashFlow = orderValues !== 0 ? (deposits / orderValues) * 100 : 0;

  console.log("string");
  console.log("orderValue:", orderValues);
  console.log("deposit:", deposits);
  console.log("numberOfInstallments:", numberOfInstallmentss);
  console.log("dd", DdMonthly);
  console.log("incre", increase);
  console.log("exp", expected2024OrderValue);
  console.log("cashflow", cashFlow);

  try {
    const order = new Order({
      createdBy: createdBy || userId,
      customer: customer_id,
      orderType,
      dateOfOrder,
      orderValue: orderValues,
      deposit: deposits,
      depositMethod,
      numberOfInstallments: numberOfInstallmentss,
      dateOfFirstDd,
      customerAccountName,
      customerAccountNumber,
      customerSortCode,
      googleEmailRenewCampaign,
      customerSignature,
      renewalDate2024,
      buildingAddress,
      DdMonthly,
      increase,
      expected2024OrderValue,
      cashFlow,
      numberOfKeyPhrase:
        orderType === "New Business" ? numberOfKeyPhrase : undefined,
      numberOfKeyAreas:
        orderType === "New Business" ? numberOfKeyAreas : undefined,
    });

    await order.save();
    console.log("save");
    res
      .status(201)
      .json(new ApiResponse(201, order, "Order created successfully"));
  } catch (error) {
    next(error);
  }
});

const getOrderById = asyncHandler(async (req, res, next) => {
  const { order_id } = req.params;
  if (!isValidObjectId(order_id)) {
    return next(new ApiError(400, "Invalid order ID"));
  }
  try {
    const order = await Order.findById(order_id)
      .populate({
        path: "customer",
      })
      .populate({
        path: "createdBy",
        select: "fullName avatar",
      });

    if (!order) {
      return next(new ApiError(404, "Order not found"));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, order, "Order retrieved successfully"));
  } catch (error) {
    return next(error);
  }
});

const updateOrder = asyncHandler(async (req, res, next) => {
  const { order_id } = req.params;
  const userId = req.user?._id;

  if (!isValidObjectId(order_id)) {
    return next(new ApiError(400, "Invalid order ID"));
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return next(new ApiError(404, "User not found"));
    }

    const order = await Order.findById(order_id);
    if (!order) {
      return next(new ApiError(404, "Order not found"));
    }

    if (
      user.role !== "admin" &&
      order.createdBy.toString() !== userId.toString()
    ) {
      return next(new ApiError(401, "Unauthorized request"));
    }

    const {
      orderType,
      renewalStatus,
      renewalNotes,
      renewalValue,
      renewalApptDandT,
      dateOfOrder,
      orderValue,
      deposit,
      numberOfInstallments,
      DdMonthly,
      DdChange,
      dateOfFirstDd,
      depositMethod,
      customerAccountName,
      customerAccountNumber,
      customerSortCode,
      googleEmailRenewCampaign,
      renewalDate2024,
      increase,
      expected2024OrderValue,
      numberOfKeyPhrase,
      numberOfKeyAreas,
      cashFlow,
      ddSetUp,
      invoiceSent,
      vatInvoice,
      buildingAddress,
      createdBy,
    } = req.body;

    if (createdBy) {
      if (!isValidObjectId(createdBy)) {
        return next(new ApiError(400, "Invalid assign id "));
      }
    }

    // let avatarurl = "";
    // console.log(avatarurl);
    // const avatarLocalPat = req.file.customerSignature;
    // console.log("HYHHHYH",avatarLocalPat);

    // if (req.file && req.file.path) {

    //   console.log(avatarLocalPath);

    //   try {
    //     const formData = new FormData();
    //     formData.append("file", fs.createReadStream(avatarLocalPath));
    //     const apiURL =
    //       "https://crm.neelnetworks.org/public/file_upload/api.php";
    //     const apiResponse = await axios.post(apiURL, formData, {
    //       headers: {
    //         ...formData.getHeaders(),
    //       },
    //     });
    //     console.log(apiResponse.data);
    //     avatarurl = apiResponse.data?.img_upload_path;
    //     if (!avatarurl) {
    //       throw new Error("img_upload_path not found in API response");
    //     }

    //     fs.unlink(avatarLocalPath, (err) => {
    //       if (err) {
    //         console.error("Error removing avatar file:", err.message);
    //       } else {
    //         console.log("Avatar file removed successfully");
    //       }
    //     });
    //   } catch (error) {
    //     console.error("Error uploading avatar:", error.message);
    //   }
    // }

    const updateData = {
      orderType,
      renewalStatus,
      renewalNotes,
      renewalValue,
      renewalApptDandT,
      dateOfOrder,
      orderValue,
      deposit,
      numberOfInstallments,
      DdMonthly,
      DdChange,
      dateOfFirstDd,
      depositMethod,
      customerAccountName,
      customerAccountNumber,
      customerSortCode,
      googleEmailRenewCampaign,
      renewalDate2024,
      increase,
      expected2024OrderValue,
      numberOfKeyPhrase,
      numberOfKeyAreas,
      cashFlow,
      ddSetUp,
      invoiceSent,
      vatInvoice,
      buildingAddress,
      createdBy,
      updatedBy: userId,
    };

    const updatedOrder = await Order.findByIdAndUpdate(order_id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedOrder) {
      return next(new ApiError(404, "Order not found after update"));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, updatedOrder, "Order updated successfully"));
  } catch (error) {
    return next(error);
  }
});

const deleteOrder = asyncHandler(async (req, res, next) => {
  const { order_id } = req.params;
  const userId = req.user?._id;

  if (!isValidObjectId(order_id)) {
    return next(new ApiError(400, "Invalid order ID"));
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return next(new ApiError(404, "User not found"));
    }

    const order = await Order.findById(order_id);
    if (!order) {
      return next(new ApiError(404, "Order not found"));
    }

    // Check permissions
    if (
      user.role !== "admin" &&
      order.createdBy.toString() !== userId.toString()
    ) {
      return next(new ApiError(401, "Unauthorized request"));
    }
    await Order.findByIdAndDelete(order_id);

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Order deleted successfully"));
  } catch (error) {
    return next(error);
  }
});

const getAllOrders = asyncHandler(async (req, res, next) => {
  try {
    const user_id = req.user?._id;
    const user = await User.findById(user_id);

    if (!user) {
      return next(new ApiError(404, "User not found"));
    }

    let page = parseInt(req.query.page, 10);
    let limit = parseInt(req.query.limit, 10);
    let skip = (page - 1) * limit;

    let orders;
    let totalSums;
    let totalCount;

    if (user.role === "admin") {
      totalCount = await Order.countDocuments();
      orders = await Order.find()
        .populate({
          path: "customer",
          // select: "companyName customerEmail",
        })
        .populate({
          path: "createdBy",
          select: "fullName avatar",
        })
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });

      totalSums = await Order.aggregate([
        {
          $group: {
            _id: null,
            totalIncrease: { $sum: "$increase" },
            totalExpected2024OrderValue: { $sum: "$expected2024OrderValue" },
            totalOrderValue: { $sum: "$orderValue" },
            totalDeposit: { $sum: "$deposit" },
            totalDdMonthly: { $sum: "$DdMonthly" },
            totalRenewalValue: { $sum: "$renewalValue" },
          },
        },
      ]);
    } else if (user.role === "salesman") {
      totalCount = await Order.countDocuments({ createdBy: user_id });
      orders = await Order.find({ createdBy: user_id })
        .populate({
          path: "customer",
          // select: "companyName customerEmail",
        })
        .populate({
          path: "createdBy",
          select: "fullName avatar",
        })
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });

      totalSums = await Order.aggregate([
        {
          $match: { createdBy: user_id },
        },
        {
          $group: {
            _id: null,
            totalIncrease: { $sum: "$increase" },
            totalExpected2024OrderValue: { $sum: "$expected2024OrderValue" },
            totalOrderValue: { $sum: "$orderValue" },
            totalDeposit: { $sum: "$deposit" },
            totalDdMonthly: { $sum: "$DdMonthly" },
            totalRenewalValue: { $sum: "$renewalValue" },
          },
        },
      ]);
    } else {
      // Handle invalid role case
      return next(new ApiError(403, "Unauthorized access"));
    }

    const totals = totalSums[0] || {
      totalIncrease: 0,
      totalExpected2024OrderValue: 0,
      totalOrderValue: 0,
      totalDeposit: 0,
      totalDdMonthly: 0,
      totalRenewalValue: 0,
    };

    const totalPages = Math.ceil(totalCount / limit);

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          orders,
          totals,
          totalPages,
          totalCount,
          currentPage: page,
          pageSize: limit,
        },
        "Orders and their totals retrieved successfully"
      )
    );
  } catch (error) {
    return next(error);
  }
});

// generateInvoicePDF.js

const createInvoicePDF = asyncHandler(async (req, res, next) => {
  const { orderId } = req.params;
  // const {email,binary}=req.body
  // console.log(req);
  // // console.log("email",binary);
  try {
    const order = await Order.findById(orderId).populate("customer");
    if (!order) {
      return next(new ApiError(404, "Order not found"));
    }
    if (!order.customer) {
      throw new ApiError(400, "No customer assigned to this order");
    }

    const customer = order.customer;
    const companyName = customer.companyName || "";
    const streetNoName = customer.streetNoName || "";
    const town = customer.town || "";
    const county = customer.county || "";
    const postcode = customer.postcode || "N/A";
    const invoiceDate = order.dateOfOrder || new Date();
    const ddStartDate =
      order.dateOfFirstDd ||
      new Date(invoiceDate.getFullYear(), invoiceDate.getMonth() + 1, 1);
    const orderValue = order.orderValue || 0;
    const vat = orderValue * 0.2;
    const totalWithVat = orderValue + vat;
    const deposit = order.deposit || 0;
    const depositVat = deposit * 0.2;
    const totalDepositDue = deposit + depositVat;
    const numberOfInstallments = order.numberOfInstallments || 0;
    let installmentAmount = 0;
    let installmentVat = 0;
    let totalInstallment = 0;

    if (numberOfInstallments > 0) {
      installmentAmount = (orderValue - deposit) / numberOfInstallments;
      installmentVat = installmentAmount * (1 / 5);
      totalInstallment = installmentAmount + installmentVat;
    }

    const doc = new PDFDocument({ margin: 50 });
    // const filePath = `public/invoices/invoice_${order._id}.pdf`;
    const invoiceFileName = `invoice_${order._id}.pdf`;
    const invoicesFolderPath = path.join(
      __dirname,
      "..",
      "..",
      "public",
      "invoices"
    );
    const filePath = path.join(invoicesFolderPath, invoiceFileName);

    console.log("filepath invoice", filePath);
    doc.pipe(fs.createWriteStream(filePath));

    const styles = {
      header: { fontSize: 10, font: "Helvetica-Bold" },
      normal: { fontSize: 10, font: "Helvetica" },
      title: { fontSize: 20, font: "Helvetica-Bold" },
      subtitle: { fontSize: 12, font: "Helvetica-Bold" },
      tableHeader: { fontSize: 10, font: "Helvetica-Bold" },
      tableRow: { fontSize: 10, font: "Helvetica" },
    };

    doc
      .font(styles.header.font)
      .fontSize(styles.header.fontSize)
      .text(companyName, 50, doc.y + 35)
      .font(styles.normal.font)
      .fontSize(styles.normal.fontSize)
      .text(streetNoName, 50, doc.y + 5)
      .text(town, 50, doc.y + 5)
      .text(county, 50, doc.y + 5)
      .text(postcode, 50, doc.y + 5);

    doc.moveDown();
    // // Header Section
    doc
      .image(
        path.join(__dirname, "..", "..", "public", "images", "logo1.png"),
        220,
        40,
        { width: 160, align: "center" }
      )
      .font(styles.header.font)
      .fontSize(styles.header.fontSize);
    doc
      .fillColor("black")
      .text("High Oaks Media Ltd", 300, 85, { align: "right" })
      .font(styles.normal.font)
      .fontSize(styles.normal.fontSize)
      .text("High Oaks Close", { align: "right" })
      .text("Coulsdon, Surrey", { align: "right" })
      .text("CR5 3EZ", { align: "right" })
      .text("01737 202105", { align: "right" })
      .moveDown()
      .fillColor("darkblue")
      .text("info@highoaksmedia.co.uk", {
        align: "right",
        link: "mailto:info@highoaksmedia.co.uk",
        underline: true,
      })
      .text("www.highoaksmedia.co.uk", {
        align: "right",
        link: "https://www.highoaksmedia.co.uk",
        underline: true,
      })
      .fillColor("black");

    // ***********  Invoice Title ****/////
    doc.moveDown().lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();

    doc.moveDown();
    doc
      .font(styles.header.font)
      .fontSize(styles.normal.fontSize)
      .text(`Invoice / Order Number: ${order.orderNo || "N/A"}`, 100, 200, {
        align: "center",
      });
    doc
      .font(styles.header.font)
      .fontSize(styles.normal.fontSize)
      .text(`Date: ${invoiceDate.toLocaleDateString("en-GB")}`, 100, 220, {
        align: "center",
      })
      .moveDown();
    doc.moveDown();
    // Invoice for Section

    doc.fontSize(14).text("Invoice for:", 50, doc.y);
    doc
      .fontSize(10)
      .text("High Oaks Media Business Services", 50, doc.y + 5)
      .text(`${numberOfInstallments} Months`, 50, doc.y + 5);

    doc.moveDown(2);
    // Separator Line
    doc.moveDown().lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();

    // Invoice Details
    doc.moveDown();
    // Invoice Details
    doc
      .moveDown()
      .font(styles.subtitle.font)
      .fontSize(styles.subtitle.fontSize)
      .text("Order Details", { underline: true });

    // Create a simple table for order details
    const createTable = (doc, headers, rows) => {
      const tableTop = doc.y + 10;
      const tableLeft = 50;
      const columnWidth = 125;

      // Draw headers
      doc.font(styles.tableHeader.font).fontSize(styles.tableHeader.fontSize);
      headers.forEach((header, i) => {
        doc.text(header, tableLeft + i * columnWidth, tableTop);
      });

      // Draw rows
      doc.font(styles.tableRow.font).fontSize(styles.tableRow.fontSize);
      rows.forEach((row, rowIndex) => {
        row.forEach((cell, columnIndex) => {
          doc.text(
            cell,
            tableLeft + columnIndex * columnWidth,
            tableTop + 20 + rowIndex * 20
          );
        });
      });
    };

    // Table rows
    const tableRows = [
      [
        "Order Value",
        `£${orderValue.toFixed(2)}`,
        `£${vat.toFixed(2)}`,
        `£${totalWithVat.toFixed(2)}`,
      ],
      [
        "Deposit",
        `£${deposit.toFixed(2)}`,
        `£${depositVat.toFixed(2)}`,
        `£${totalDepositDue.toFixed(2)}`,
      ],
    ];

    // If there are installments, add them to the table
    if (numberOfInstallments > 0) {
      tableRows.push([
        "Direct Debit Instalments",
        `£${installmentAmount.toFixed(2)}`,
        `£${installmentVat.toFixed(2)}`,
        `£${totalInstallment.toFixed(2)}`,
      ]);
    }

    createTable(doc, ["Description", "Amount", "VAT 20%", "Total"], tableRows);
    // Footer Section
    doc.moveDown(2).lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();

    doc
      .font(styles.subtitle.font)
      .fontSize(styles.subtitle.fontSize)
      .text(
        "Account Details for clients needing to pay directly via electronic transfer:",
        50,
        doc.y + 15,
        { align: "center" }
      )
      .moveDown()
      .font(styles.normal.font)
      .fontSize(styles.normal.fontSize)
      .text("Bank: Lloyds Bank Plc", 50, doc.y + 15, { align: "center" })
      .text("Account Name: High Oaks Media Ltd", 50, doc.y + 5, {
        align: "center",
      })
      .text("Sort Code: 309009", 50, doc.y + 5, { align: "center" })
      .text("Account Number: 51290568", 50, doc.y + 5, { align: "center" })
      .moveDown()
      .font(styles.header.font)
      .fontSize(styles.header.fontSize)
      .text("Company Registration Number: 12041124", 50, doc.y + 15, {
        align: "center",
      })
      .text("VAT Registered Number: 337 5631 89", 50, doc.y + 5, {
        align: "center",
      })
      .text(
        "Registered Business Address: High Oaks Close, Coulsdon, Surrey, CR5 3EZ",
        50,
        doc.y + 5,
        { align: "center" }
      );
    doc.end();
    await new Promise((resolve) => doc.on("end", resolve));
    const url = `${req.protocol}://${req.get("host")}/invoices/${path.basename(
      filePath
    )}`;
    // console.log("req",req);
    console.log("path", path);
    order.vatInvoice = url;
    if (order.customer._id) {
      await Customer.findByIdAndUpdate(
        order.customer._id,
        { vatInvoice: url },
        { new: true }
      );
    }
    await order.save();
    res.status(200).json(
      new ApiResponse(
        200,
        {
          url,
        },
        "Invoice Generate successfully"
      )
    );
  } catch (error) {
    console.error("Error generating invoice PDF:", error.message);
    next(error);
  }
});

const createInvoice = async (orderId) => {
  try {
    const order = await Order.findById(orderId).populate("customer");
    if (!order) {
      throw new Error("Order not found");
    }
    if (!order.customer) {
      throw new Error("No customer assigned to this order");
    }

    const customer = order.customer;
    const companyName = customer.companyName || "";
    const streetNoName = customer.streetNoName || "";
    const town = customer.town || "";
    const county = customer.county || "";
    const postcode = customer.postcode || "N/A";
    const invoiceDate = order.dateOfOrder || new Date();
    const ddStartDate =
      order.dateOfFirstDd ||
      new Date(invoiceDate.getFullYear(), invoiceDate.getMonth() + 1, 1);
    const orderValue = order.orderValue || 0;
    const vat = orderValue * 0.2;
    const totalWithVat = orderValue + vat;
    const deposit = order.deposit || 0;
    const depositVat = deposit * 0.2;
    const totalDepositDue = deposit + depositVat;
    const numberOfInstallments = order.numberOfInstallments || 0;
    let installmentAmount = 0;
    let installmentVat = 0;
    let totalInstallment = 0;

    if (numberOfInstallments > 0) {
      installmentAmount = (orderValue - deposit) / numberOfInstallments;
      installmentVat = installmentAmount * (1 / 5);
      totalInstallment = installmentAmount + installmentVat;
    }

    const doc = new PDFDocument({ margin: 50 });
    const invoiceFileName = `invoice_${order._id}.pdf`;
    const invoicesFolderPath = path.join(
      __dirname,
      "..",
      "..",
      "public",
      "invoices"
    );
    const filePath = path.join(invoicesFolderPath, invoiceFileName);

    doc.pipe(fs.createWriteStream(filePath));

    // ... (rest of the PDF generation code remains the same)

    doc.end();
    await new Promise((resolve) => doc.on("end", resolve));

    return filePath;
  } catch (error) {
    console.error("Error generating invoice PDF:", error.message);
    throw error;
  }
};

const sendInvoiceForEmail = asyncHandler(async (req, res, next) => {
  const { orderId } = req.params;
  const {
    to: customEmail,
    subject: customSubject,
    from: customFrom,
    message: customHtml,
  } = req.body;

  if (!isValidObjectId(orderId)) {
    return next(new ApiError(400, "Invalid order ID"));
  }
  try {
    const order = await Order.findById(orderId).populate("customer");
    if (!order) {
      throw new ApiError(404, "Order not found");
    }

    if (!order.customer) {
      throw new ApiError(400, "No customer assigned to this order");
    }

    if (!order.vatInvoice) {
      throw new ApiError(404, "Please Create Invoice");
    }
    const { orderNo, orderValue, dateOfOrder } = order;
    const customerName = order.customer.companyName || "Valued Customer";
    // Default values
    const toemail = customEmail || order.customer?.customerEmail;
    const from = customFrom || `"High Oaks Media" <${process.env.EMAIL_FROM}>`;
    const subject = customSubject || `Invoice for Order #${orderNo}`;
    const text = `Please find attached the invoice for your order #${orderNo}.`;
    const invoicePdfUrl=order.vatInvoice
    const defaultHtml = `
      <ul style="list-style-type: none; padding-left: 0;">
        <li><strong>Order Number:</strong> ${orderNo}</li>
        <li><strong>Order Date:</strong> ${new Date(
          dateOfOrder
        ).toLocaleDateString("en-GB")}</li>
        <li><strong>Order Value:</strong> £${orderValue.toFixed(2)}</li>
      </ul>
    `;
  //   const html = `
  //   <!DOCTYPE html>
  //   <html lang="en">
  //   <head>
  //     <meta charset="UTF-8">
  //     <meta name="viewport" content="width=device-width, initial-scale=1.0">
  //     <title>${subject}</title>
  //     <!--[if mso]>
  //     <noscript>
  //       <xml>
  //         <o:OfficeDocumentSettings>
  //           <o:PixelsPerInch>96</o:PixelsPerInch>
  //         </o:OfficeDocumentSettings>
  //       </xml>
  //     </noscript>
  //     <![endif]-->
  //     <style>
  //       @media screen and (max-width: 600px) {
  //         .container {
  //           width: 100% !important;
  //         }
  //         .content {
  //           padding: 10px !important;
  //         }
  //         .button {
  //           width: 100% !important;
  //         }
  //       }
  //     </style>
  //   </head>
  //   <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #333333; background-color: #f4f4f4;">
  //     <table border="0" cellpadding="0" cellspacing="0" width="100%" style="min-width: 100%; background-color: #f4f4f4;">
  //       <tr>
  //         <td align="center" valign="top">
  //           <table class="container" border="0" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px; background-color: #ffffff;">
  //             <tr>
  //               <td align="center" valign="top" style="background-color: #003366; padding: 20px;">
  //                 <h1 style="color: #ffffff; margin: 0; font-size: 24px;">High Oaks Media</h1>
  //               </td>
  //             </tr>
  //             <tr>
  //               <td class="content" align="left" valign="top" style="padding: 20px;">
  //                 <p>Dear ${customerName},</p>
  //                 <p>${text}</p>
  //                 <p>Order Details:</p>
  //                 ${customHtml || defaultHtml}
  //                 <p>You can also view your invoice online by clicking the button below:</p>
  //                 <table border="0" cellpadding="0" cellspacing="0" width="100%" style="min-width: 100%;">
  //                   <tr>
  //                     <td align="center">
  //                       <table border="0" cellpadding="0" cellspacing="0">
  //                         <tr>
  //                           <td align="center" bgcolor="#003366" style="border-radius: 5px;">
  //                             <a href="${
  //                               order.vatInvoice
  //                             }" class="button" target="_blank" style="display: inline-block; padding: 12px 24px; font-size: 16px; color: #ffffff; text-decoration: none;">View Invoice Online</a>
  //                           </td>
  //                         </tr>
  //                       </table>
  //                     </td>
  //                   </tr>
  //                 </table>
  //                 <p>If you have any questions or concerns, please don't hesitate to contact our support team.</p>
  //               </td>
  //             </tr>
  //             <tr>
  //               <td align="center" valign="top" style="background-color: #f4f4f4; padding: 20px; font-size: 14px;">
  //                 <p style="margin: 0;">Best regards,<br>The High Oaks Media Team</p>
  //                 <p style="margin: 10px 0 0 0;">High Oaks Media Ltd | High Oaks Close, Coulsdon, Surrey, CR5 3EZ | 01737 202105</p>
  //               </td>
  //             </tr>
  //           </table>
  //         </td>
  //       </tr>
  //     </table>
  //   </body>
  //   </html>
  // `;
    // Fetch the VAT invoice file
    // const vatInvoiceResponse = await fetch(order.vatInvoice);
    // console.log("vatinvoice",vatInvoiceResponse);
    // const vatInvoiceBuffer = await vatInvoiceResponse.arrayBuffer();
    // console.log(vatInvoiceBuffer);

    // const attachments = [
    //   {
    //     filename: `Invoice_${orderNo}.pdf`,
    //     content: Buffer.from(vatInvoiceBuffer),
    //     contentType: "application/pdf",
    //   },
    // ];
    
   
    const html=`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
          <!--[if mso]>
          <noscript>
            <xml>
              <o:OfficeDocumentSettings>
                <o:PixelsPerInch>96</o:PixelsPerInch>
              </o:OfficeDocumentSettings>
            </xml>
          </noscript>
          <![endif]-->
          <style>
            @media screen and (max-width: 600px) {
              .container {
                width: 100% !important;
                max-width: 100% !important;
              }
              .content {
                padding: 20px !important;
              }
              .button {
                display: block !important;
                width: 100% !important;
                padding: 10px 0 !important;
              }
            }
          </style>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #333333; background-color: #f4f4f4;">
          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="min-width: 100%; background-color: #f4f4f4;">
            <tr>
              <td align="center" valign="top">
                <table class="container" border="0" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px; background-color: #ffffff;">
                  <tr>
                    <td align="center" valign="top" style="background-color: #003366; padding: 20px;">
                      <h1 style="color: #ffffff; margin: 0; font-size: 24px;">High Oaks Media</h1>
                    </td>
                  </tr>
                  <tr>
                    <td class="content" align="left" valign="top" style="padding: 40px 40px 20px 40px;">
                      <p>Dear ${customerName},</p>
                      <p>${text}</p>
                      <p>Order Details:</p>
                      ${customHtml || defaultHtml}
                      <p>You can also view your invoice online by clicking the button below:</p>
                      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="min-width: 100%;">
                        <tr>
                          <td align="center">
                            <table border="0" cellpadding="0" cellspacing="0">
                              <tr>
                                <td align="center" bgcolor="#003366" style="border-radius: 5px;">
                                  <a href="${order.vatInvoice}" class="button" target="_blank" style="display: inline-block; padding: 12px 24px; font-size: 16px; color: #ffffff; text-decoration: none;">View Invoice</a>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                      <p>If you have any questions or concerns, please don't hesitate to contact our support team.</p>
                    </td>
                  </tr>
                  <tr>
                    <td align="center" valign="top" style="background-color: #f4f4f4; padding: 20px; font-size: 14px;">
                      <p style="margin: 0;">Best regards,<br>The High Oaks Media Team</p>
                      <p style="margin: 10px 0 0 0;">High Oaks Media Ltd | High Oaks Close, Coulsdon, Surrey, CR5 3EZ | 01737 202105</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `;
    
    
     

    const sendInvoiceResult = await sendInvoiceEmail(
      toemail, 
      subject,
      text,
      html,
      from,
      invoicePdfUrl
    );
    res
      .status(200)
      .json(
        new ApiResponse(200, { sendInvoiceResult }, "Email sent successfully")
      );
  } catch (error) {
    next(error);
  }
});

export {
  addOrder,
  getAllOrders,
  updateOrder,
  getOrderById,
  deleteOrder,
  createInvoicePDF,
  sendInvoiceForEmail,
};

//  const getAllOrders = asyncHandler(async (req, res, next) => {
//     try {
//       const user_id = req.user?._id;
//       const user = await User.findById(user_id);

//       if (!user) {
//         return next(new ApiError(404, "User not found"));
//       }

//       let orders;
//       if (user.role === "admin") {
//         orders = await Order.find().populate({
//           path: 'customer',
//         }).populate({
//           path: 'createdBy',
//           select: 'fullName avatar',
//         });
//       } else if (user.role === "salesman") {
//         orders = await Order.find({ createdBy: user_id }).populate({
//           path: 'customer',
//         }).populate({
//           path: 'createdBy',
//           select: 'fullName avatar',
//         });
//       } else {
//         return next(new ApiError(403, "Unauthorized access"));
//       }

//       return res.status(200).json(new ApiResponse(200, orders, "Orders retrieved successfully"));
//     } catch (error) {
//       return next(error);
//     }
//   });

// const getAllUpdates = asyncHandler(async (req, res, next) => {
//   const { customerId } = req.params;
//   try {
//     const customerUpdates = await Customer.aggregate([
//       { $match: { _id: new mongoose.Types.ObjectId(customerId) } },
//       {
//         $lookup: {
//           from: 'updates', // The collection to join
//           localField: 'updates', // The field from the customer documents
//           foreignField: '_id', // The field from the updates collection
//           as: 'updates'
//         }
//       },
//       { $unwind: '$updates' }, // Unwind the updates array
//       {
//         $lookup: {
//           from: 'users',
//           localField: 'updates.createdBy',
//           foreignField: '_id',
//           as: 'updates.createdBy'
//         }
//       },
//       { $unwind: '$updates.createdBy' }, // Unwind the createdBy array
//       {
//         $lookup: {
//           from: 'users',
//           localField: 'updates.mentions',
//           foreignField: '_id',
//           as: 'updates.mentions'
//         }
//       },
//       { $limit: 10 }, // Limit the number of updates
//       { $sort: { 'updates.createdAt': -1 } }, // Sort updates by creation date
//       {
//         $project: {
//           'updates.content': 1,
//           'updates.files': 1,
//           'updates.createdBy.fullname': 1,
//           'updates.createdBy.avatar': 1,
//           'updates.mentions.fullname': 1,
//           'updates.mentions.avatar': 1
//         }
//       }
//     ]);

//     if (!customerUpdates || customerUpdates.length === 0) {
//       throw new ApiError(404, 'No updates found for this customer');
//     }

//     return res.json(new ApiResponse(200, customerUpdates, 'Updates retrieved successfully'));
//   } catch (error) {
//     next(error);
//   }
// });
