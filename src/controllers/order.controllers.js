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
  const gn = await createInvoicePDF(order_id);
  console.log("gnnn", gn);

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
          select: "companyName",
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
          select: "name contactDetails",
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

async function createInvoicePDF(orderId) {
  try {
    // Fetch order and populate customer details
    const order = await Order.findById(orderId).populate("customer");
    if (!order) {
      throw new Error("Order not found");
    }

    const customer = order.customer;
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
      installmentAmount = (totalWithVat - totalDepositDue) / numberOfInstallments;
      installmentVat = installmentAmount * (1 / 6);
      totalInstallment = installmentAmount;
    }

    const doc = new PDFDocument({ margin: 50 });

    // File stream
    const filePath = `invoice/invoice_${order._id}.pdf`;
    doc.pipe(fs.createWriteStream(filePath));

    // Define styles
    const styles = {
      header: { fontSize: 10, font: 'Helvetica-Bold' },
      normal: { fontSize: 10, font: 'Helvetica' },
      title: { fontSize: 20, font: 'Helvetica-Bold' },
      subtitle: { fontSize: 12, font: 'Helvetica-Bold' },
      tableHeader: { fontSize: 10, font: 'Helvetica-Bold' },
      tableRow: { fontSize: 10, font: 'Helvetica' },
    };

    // Header Section
    doc.image("public/logo.jpg", 50, 45, { width: 100 })
       .font(styles.header.font).fontSize(styles.header.fontSize)
       .text("High Oaks Media Ltd", 200, 50, { align: "right" })
       .font(styles.normal.font).fontSize(styles.normal.fontSize)
       .text("High Oaks Close", { align: "right" })
       .text("Coulsdon, Surrey", { align: "right" })
       .text("CR5 3EZ", { align: "right" })
       .moveDown()
       .text("01737 202105", { align: "right" })
       .text("info@highoaksmedia.co.uk", {
         align: "right",
         link: "mailto:info@highoaksmedia.co.uk",
       })
       .text("www.highoaksmedia.co.uk", {
         align: "right",
         link: "https://www.highoaksmedia.co.uk",
       });

    doc.moveDown(2);

    // Invoice Title
    doc.font(styles.title.font).fontSize(styles.title.fontSize)
       .text("VAT Invoice", { align: "center", underline: true });
    doc.moveDown();
    doc.font(styles.normal.font).fontSize(styles.normal.fontSize)
       .text(`Invoice / Order Number: ${order.orderNo || "N/A"}`, { align: "center" })
       .text(`Date: ${invoiceDate.toLocaleDateString("en-GB")}`, { align: "center" })
       .moveDown();

    // Customer Address
    doc.font(styles.normal.font).fontSize(styles.normal.fontSize)
       .text("Bill To:", 50, doc.y)
       .text(customer.streetNoName || "", 50, doc.y + 15)
       .text(customer.town || "", 50, doc.y + 15)
       .text(customer.county || "", 50, doc.y + 15)
       .text(customer.postcode || "", 50, doc.y + 15);

    // Separator Line
    doc.moveDown().lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();

    // Invoice Details
    doc.moveDown()
       .font(styles.subtitle.font).fontSize(styles.subtitle.fontSize)
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
          doc.text(cell, tableLeft + columnIndex * columnWidth, tableTop + 20 + rowIndex * 20);
        });
      });
    };

    // Use the table function for order details
    createTable(
      doc,
      ['Description', 'Amount', 'VAT', 'Total'],
      [
        ['Order Value', `£${orderValue.toFixed(2)}`, `£${vat.toFixed(2)}`, `£${totalWithVat.toFixed(2)}`],
        ['Deposit', `£${deposit.toFixed(2)}`, `£${depositVat.toFixed(2)}`, `£${totalDepositDue.toFixed(2)}`],
      ]
    );

    doc.moveDown(2);

    // Installment Details
    if (numberOfInstallments > 0) {
      doc.font(styles.subtitle.font).fontSize(styles.subtitle.fontSize)
         .text("Direct Debit Instalments");

      doc.font(styles.normal.font).fontSize(styles.normal.fontSize)
         .text(`Each Instalment: £${(installmentAmount - installmentVat).toFixed(2)}`)
         .text(`VAT @ 20%: £${installmentVat.toFixed(2)}`)
         .text(`Total of ${numberOfInstallments} Instalment(s) at £${totalInstallment.toFixed(2)}`)
         .text(`Direct Debit Start Date: ${ddStartDate.toLocaleDateString("en-GB")}`);
    }

    // Footer Section
    doc.moveDown(2)
       .lineWidth(1)
       .moveTo(50, doc.y)
       .lineTo(550, doc.y)
       .stroke();

    doc.font(styles.subtitle.font).fontSize(styles.subtitle.fontSize)
       .text("Account Details for clients needing to pay directly via electronic transfer:", 50, doc.y + 10, { align: "center" })
       .moveDown()
       .font(styles.normal.font).fontSize(styles.normal.fontSize)
       .text("Bank: Lloyds Bank Plc", { align: "center" })
       .text("Account Name: High Oaks Media Ltd", { align: "center" })
       .text("Sort Code: 309009", { align: "center" })
       .text("Account Number: 51290568", { align: "center" })
       .moveDown()
       .font(styles.subtitle.font).fontSize(styles.subtitle.fontSize)
       .text("Company Registration Number: 12041124", { align: "center" })
       .text("VAT Registered Number: 337 5631 89", { align: "center" })
       .text("Registered Business Address: High Oaks Close, Coulsdon, Surrey, CR5 3EZ", { align: "center" });

    // Finalize PDF file
    doc.end();

    return filePath;
  } catch (error) {
    console.error("Error generating invoice PDF:", error.message);
    throw error;
  }
}


export { addOrder, getAllOrders, updateOrder, getOrderById, deleteOrder };

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
