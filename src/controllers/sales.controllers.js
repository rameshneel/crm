import { asyncHandler } from "../utils/asyncHandler.js";
import Order from "../models/order.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";

const getSalesmanOrderStats = asyncHandler(async (req, res, next) => {
  try {
    const user = await User.findById(req.user?._id);

    if (!user) {
      return next(new ApiError(403, "Unauthorized access"));
    }

    const matchCondition = user.role === "admin" ? {} : { createdBy: req.user._id };

    const orderStats = await Order.aggregate([
      {
        $match: matchCondition, // Match orders based on user role
      },
      {
        $group: {
          _id: {
            salesmanId: "$createdBy",
            orderType: "$orderType", // Group by salesman ID and order type
          },
          totalOrderValue: { $sum: "$orderValue" },
          totalOrders: { $count: {} }, // Count of orders
        },
      },
      {
        $group: {
          _id: "$_id.salesmanId", // Regroup to get total values per salesman
          orderTypes: {
            $push: {
              orderType: "$_id.orderType",
              totalOrderValue: "$totalOrderValue",
              totalOrders: "$totalOrders",
            },
          },
          totalSalesmanValue: { $sum: "$totalOrderValue" },
          totalSalesmanOrders: { $sum: "$totalOrders" },
        },
      },
      {
        $lookup: {
          from: "users", // Assuming "users" is the collection name for users
          localField: "_id",
          foreignField: "_id",
          as: "salesmanDetails",
        },
      },
      {
        $unwind: {
          path: "$salesmanDetails",
          preserveNullAndEmptyArrays: true, // Keep orders with no associated salesman
        },
      },
      {
        $project: {
          _id: 0, // Exclude the default MongoDB _id field
          salesmanId: "$_id",
          salesmanName: { $toString: "$salesmanDetails.fullName" },
          salesmanAvatar: { $toString: "$salesmanDetails.avatar" },
          totalSalesmanValue: 1,
          totalSalesmanOrders: 1,
          orderTypes: {
            $arrayToObject: {
              $map: {
                input: "$orderTypes",
                as: "ot",
                in: {
                  k: "$$ot.orderType",
                  v: {
                    totalOrderValue: "$$ot.totalOrderValue",
                    totalOrders: "$$ot.totalOrders",
                    percentage: {
                      $multiply: [
                        { $divide: ["$$ot.totalOrders", "$totalSalesmanOrders"] },
                        100,
                      ],
                    },
                  },
                },
              },
            },
          },
          overall: {
            totalOrders: "$totalSalesmanOrders",
            totalOrderValue: "$totalSalesmanValue",
            orderTypeCounts: {
              Renewal: {
                $ifNull: [
                  {
                    $arrayElemAt: [
                      {
                        $filter: {
                          input: "$orderTypes",
                          as: "ot",
                          cond: { $eq: ["$$ot.orderType", "Renewal"] },
                        },
                      },
                      0,
                    ],
                  },
                  { totalOrderValue: 0, totalOrders: 0 },
                ],
              },
              NewBusiness: {
                $ifNull: [
                  {
                    $arrayElemAt: [
                      {
                        $filter: {
                          input: "$orderTypes",
                          as: "ot",
                          cond: { $eq: ["$$ot.orderType", "New Business"] },
                        },
                      },
                      0,
                    ],
                  },
                  { totalOrderValue: 0, totalOrders: 0 },
                ],
              },
            },
          },
        },
      },
      {
        $project: {
          salesmanId: 1,
          salesmanName: 1,
          salesmanAvatar: 1,
          totalSalesmanValue: 1,
          totalSalesmanOrders: 1,
          overall: {
            totalOrders: "$overall.totalOrders",
            totalOrderValue: "$overall.totalOrderValue",
            renewal: {
              totalOrders: { $ifNull: ["$overall.orderTypeCounts.Renewal.totalOrders", 0] },
              totalOrderValue: { $ifNull: ["$overall.orderTypeCounts.Renewal.totalOrderValue", 0] },
              percentage: {
                $multiply: [
                  {
                    $divide: [
                      { $ifNull: ["$overall.orderTypeCounts.Renewal.totalOrders", 0] },
                      { $ifNull: ["$overall.totalOrders", 1] },
                    ],
                  },
                  100,
                ],
              },
            },
            newBusiness: {
              totalOrders: { $ifNull: ["$overall.orderTypeCounts.NewBusiness.totalOrders", 0] },
              totalOrderValue: { $ifNull: ["$overall.orderTypeCounts.NewBusiness.totalOrderValue", 0] },
              percentage: {
                $multiply: [
                  {
                    $divide: [
                      { $ifNull: ["$overall.orderTypeCounts.NewBusiness.totalOrders", 0] },
                      { $ifNull: ["$overall.totalOrders", 1] },
                    ],
                  },
                  100,
                ],
              },
            },
          },
        },
      },
    ]);

     // Calculate Totaloverall for all salesmen
     const totalOverall = await Order.aggregate([
      {
        $group: {
          _id: null,
          renewalOrders: {
            $sum: {
              $cond: [{ $eq: ["$orderType", "Renewal"] }, 1, 0],
            },
          },
          newBusinessOrders: {
            $sum: {
              $cond: [{ $eq: ["$orderType", "New Business"] }, 1, 0],
            },
          },
          totalRenewalValue: {
            $sum: {
              $cond: [{ $eq: ["$orderType", "Renewal"] }, "$orderValue", 0],
            },
          },
          totalNewBusinessValue: {
            $sum: {
              $cond: [{ $eq: ["$orderType", "New Business"] }, "$orderValue", 0],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          overall: {
            totalOrders: { $add: ["$renewalOrders", "$newBusinessOrders"] },
            totalOrderValue: { $add: ["$totalRenewalValue", "$totalNewBusinessValue"] },
            renewal: {
              totalOrders: "$renewalOrders",
              totalOrderValue: "$totalRenewalValue",
              percentage: {
                $multiply: [
                  {
                    $divide: [
                      "$renewalOrders",
                      { $add: ["$renewalOrders", "$newBusinessOrders"] }
                    ]
                  },
                  100,
                ],
              },
            },
            newBusiness: {
              totalOrders: "$newBusinessOrders",
              totalOrderValue: "$totalNewBusinessValue",
              percentage: {
                $multiply: [
                  {
                    $divide: [
                      "$newBusinessOrders",
                      { $add: ["$renewalOrders", "$newBusinessOrders"] }
                    ]
                  },
                  100,
                ],
              },
            },
          },
        },
      },
    ]);

    const totalOverallResult = totalOverall.length ? totalOverall[0] : {
      overall: {
        totalOrders: 0,
        totalOrderValue: 0,
        renewal: {
          totalOrders: 0,
          totalOrderValue: 0,
          percentage: 0,
        },
        newBusiness: {
          totalOrders: 0,
          totalOrderValue: 0,
          percentage: 0,
        },
      },
    };

      
    
    return res.status(200).json(
      new ApiResponse(
        200,
        {
          orderStats,
          totalOverallResult, 
        },
        "Salesman order statistics retrieved successfully"
      )
    );
  } catch (error) {
    return next(error);
  }
});
const getSalesmanCurrentYearStats = asyncHandler(async (req, res, next) => {
  try {
    const user = await User.findById(req.user?._id);

    if (!user || user.role !== "admin") {
      return next(new ApiError(403, "Unauthorized access"));
    }

    const currentYear = new Date().getFullYear();
    const startDate = new Date(`${currentYear}-01-01T00:00:00.000Z`);
    const endDate = new Date(`${currentYear + 1}-01-01T00:00:00.000Z`);

    const orderStats = await Order.aggregate([
      {
        $match: {
          dateOfOrder: {
            $gte: startDate,
            $lt: endDate,
          },
        },
      },
      {
        $group: {
          _id: "$createdBy", // Group by salesman ID
          totalOrderValue: { $sum: "$orderValue" },
          totalOrders: { $count: {} }, // Count of orders
        },
      },
      {
        $lookup: {
          from: "users", // Assuming "users" is the collection name for users
          localField: "_id",
          foreignField: "_id",
          as: "salesmanDetails",
        },
      },
      {
        $unwind: {
          path: "$salesmanDetails",
          preserveNullAndEmptyArrays: true, // Keep orders with no associated salesman
        },
      },
      {
        $project: {
          _id: 0, // Exclude the default MongoDB _id field
          salesmanId: "$_id",
          salesmanName: {
            $concat: [
              "$salesmanDetails.fullName",
              " (",
              { $toString: "$salesmanDetails._id" },
              ")",
            ],
          },
          totalOrderValue: 1,
          totalOrders: 1,
        },
      },
    ]);

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          orderStats,
        },
        "Salesman current year sales statistics retrieved successfully"
      )
    );
  } catch (error) {
    return next(error);
  }
});
const getSalesmanMonthlyStats = asyncHandler(async (req, res, next) => {
  try {
    const user = await User.findById(req.user?._id);

    if (!user || user.role !== "admin") {
      return next(new ApiError(403, "Unauthorized access"));
    }
    const currentYear = new Date().getFullYear();
    const startDate = new Date(`${currentYear}-01-01T00:00:00.000Z`);
    const endDate = new Date(`${currentYear + 1}-01-01T00:00:00.000Z`);

    const orderStats = await Order.aggregate([
      {
        $match: {
          dateOfOrder: {
            $gte: startDate,
            $lt: endDate,
          },
        },
      },
      {
        $group: {
          _id: {
            month: { $month: "$dateOfOrder" }, // Group by month
            salesmanId: "$createdBy", // Group by salesman ID
          },
          totalOrderValue: { $sum: "$orderValue" },
          totalOrders: { $count: {} }, // Count of orders
        },
      },
      {
        $lookup: {
          from: "users", // Assuming "users" is the collection name for users
          localField: "_id.salesmanId",
          foreignField: "_id",
          as: "salesmanDetails",
        },
      },
      {
        $unwind: {
          path: "$salesmanDetails",
          preserveNullAndEmptyArrays: true, // Keep orders with no associated salesman
        },
      },
      {
        $project: {
          _id: 0, // Exclude the default MongoDB _id field
          month: "$_id.month",
          salesmanId: "$_id.salesmanId",
          salesmanName: {
            $concat: [
              "$salesmanDetails.fullName",
              " (",
              { $toString: "$salesmanDetails._id" },
              ")",
            ],
          },
          totalOrderValue: 1,
          totalOrders: 1,
        },
      },
      {
        $sort: { month: 1 }, // Sort by month
      },
    ]);

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          orderStats,
        },
        "Salesman monthly sales statistics retrieved successfully"
      )
    );
  } catch (error) {
    return next(error);
  }
});
const getOrderStatsByCreator = asyncHandler(async (req, res, next) => {
  const userId = req.user?._id;

  if (!userId) {
    return next(new ApiError(400, "User ID is required"));
  }

  try {
    // Aggregate orders based on createdBy
    const stats = await Order.aggregate([
      { $match: { createdBy: userId } },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m", date: "$dateOfOrder" }, // Group by month
          },
          totalOrders: { $sum: 1 },
          totalOrderValue: { $sum: "$orderValue" },
          renewalCount: {
            $sum: { $cond: [{ $eq: ["$orderType", "Renewal"] }, 1, 0] },
          },
          newBusinessCount: {
            $sum: { $cond: [{ $eq: ["$orderType", "New Business"] }, 1, 0] },
          },
        },
      },
      { $sort: { _id: -1 } }, // Sort by date descending
    ]);

    // Optional: Aggregate yearly data if needed
    const yearlyStats = await Order.aggregate([
      { $match: { createdBy: userId } },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y", date: "$dateOfOrder" }, // Group by year
          },
          totalOrders: { $sum: 1 },
          totalOrderValue: { $sum: "$orderValue" },
          renewalCount: {
            $sum: { $cond: [{ $eq: ["$orderType", "Renewal"] }, 1, 0] },
          },
          newBusinessCount: {
            $sum: { $cond: [{ $eq: ["$orderType", "New Business"] }, 1, 0] },
          },
        },
      },
      { $sort: { _id: -1 } }, // Sort by year descending
    ]);

    res.status(200).json({
      message: "Order statistics retrieved successfully",
      monthlyStats: stats,
      yearlyStats: yearlyStats,
    });
  } catch (error) {
    next(error);
  }
});
export {
  getSalesmanCurrentYearStats,
  getSalesmanMonthlyStats,
  getSalesmanOrderStats,
  getOrderStatsByCreator,
};






// const getMonthlySalesmanOrderStats = asyncHandler(async (req, res, next) => {
//   try {
//     const user = await User.findById(req.user?._id);

//     if (!user) {
//       return next(new ApiError(403, "Unauthorized access"));
//     }

//     const { year, month } = req.params; // Get the year and month from request parameters
//   console.log("year monrh",year,mo);
  
//     if (!year || isNaN(year) || year < 2000 || year > new Date().getFullYear()) {
//       return next(new ApiError(400, "Invalid year provided"));
//     }

//     if (!month || isNaN(month) || month < 1 || month > 12) {
//       return next(new ApiError(400, "Invalid month provided"));
//     }

//     const matchCondition = user.role === "admin" ? {} : { createdBy: req.user._id };

//     // Retrieve order statistics
//     const orderStats = await Order.aggregate([
//       {
//         $match: {
//           ...matchCondition,
//           dateOfOrder: {
//             $gte: new Date(`${year}-${month}-01T00:00:00Z`),
//             $lt: new Date(`${year}-${month + 1}-01T00:00:00Z`), // Match the entire month
//           },
//         },
//       },
//       {
//         $lookup: {
//           from: "users", // Assuming "users" is the collection for salesmen
//           localField: "createdBy",
//           foreignField: "_id",
//           as: "salesmanDetails",
//         },
//       },
//       {
//         $unwind: {
//           path: "$salesmanDetails",
//           preserveNullAndEmptyArrays: true, // Include orders with no associated salesman
//         },
//       },
//       {
//         $group: {
//           _id: {
//             orderType: "$orderType", // Group by order type
//             salesmanId: "$createdBy" // Include salesman ID for grouping
//           },
//           totalOrderValue: { $sum: "$orderValue" },
//           totalOrders: { $count: {} },
//           salesmen: {
//             $push: {
//               salesmanId: "$salesmanDetails._id",
//               salesmanName: "$salesmanDetails.fullName",
//               salesmanAvatar: "$salesmanDetails.avatar",
//               orderValue: "$totalOrderValue",
//               orderCount: "$totalOrders",
//             },
//           },
//         },
//       },
//       {
//         $group: {
//           _id: "$_id.orderType", // Regroup by order type
//           totalOrderValue: { $sum: "$totalOrderValue" },
//           totalOrders: { $sum: "$totalOrders" },
//           salesmen: { $push: "$salesmen" },
//         },
//       },
//       {
//         $project: {
//           orderType: "$_id",
//           totalOrderValue: 1,
//           totalOrders: 1,
//           salesmen: 1,
//           percentage: {
//             $multiply: [
//               { $divide: ["$totalOrders", { $sum: "$totalOrders" }] }, // Total orders for the month
//               100,
//             ],
//           },
//         },
//       },
//     ]);

//     // Retrieve all orders for the specified month
//     const allOrders = await Order.find({
//       ...matchCondition,
//       dateOfOrder: {
//         $gte: new Date(`${year}-${month}-01T00:00:00Z`),
//         $lt: new Date(`${year}-${month + 1}-01T00:00:00Z`),
//       },
//     }).populate("createdBy", "fullName avatar"); // Populate salesman details

//     // Calculate total overall for all salesmen for the given year and month
//     const totalOverall = await Order.aggregate([
//       {
//         $match: {
//           dateOfOrder: {
//             $gte: new Date(`${year}-${month}-01T00:00:00Z`),
//             $lt: new Date(`${year}-${month + 1}-01T00:00:00Z`),
//           },
//         },
//       },
//       {
//         $group: {
//           _id: null,
//           renewalOrders: {
//             $sum: {
//               $cond: [{ $eq: ["$orderType", "Renewal"] }, 1, 0],
//             },
//           },
//           newBusinessOrders: {
//             $sum: {
//               $cond: [{ $eq: ["$orderType", "New Business"] }, 1, 0],
//             },
//           },
//           totalRenewalValue: {
//             $sum: {
//               $cond: [{ $eq: ["$orderType", "Renewal"] }, "$orderValue", 0],
//             },
//           },
//           totalNewBusinessValue: {
//             $sum: {
//               $cond: [{ $eq: ["$orderType", "New Business"] }, "$orderValue", 0],
//             },
//           },
//         },
//       },
//       {
//         $project: {
//           _id: 0,
//           overall: {
//             totalOrders: { $add: ["$renewalOrders", "$newBusinessOrders"] },
//             totalOrderValue: { $add: ["$totalRenewalValue", "$totalNewBusinessValue"] },
//             renewal: {
//               totalOrders: "$renewalOrders",
//               totalOrderValue: "$totalRenewalValue",
//               percentage: {
//                 $multiply: [
//                   {
//                     $divide: [
//                       "$renewalOrders",
//                       { $add: ["$renewalOrders", "$newBusinessOrders"] },
//                     ],
//                   },
//                   100,
//                 ],
//               },
//             },
//             newBusiness: {
//               totalOrders: "$newBusinessOrders",
//               totalOrderValue: "$totalNewBusinessValue",
//               percentage: {
//                 $multiply: [
//                   {
//                     $divide: [
//                       "$newBusinessOrders",
//                       { $add: ["$renewalOrders", "$newBusinessOrders"] },
//                     ],
//                   },
//                   100,
//                 ],
//               },
//             },
//           },
//         },
//       },
//     ]);

//     const totalOverallResult = totalOverall.length ? totalOverall[0] : {
//       overall: {
//         totalOrders: 0,
//         totalOrderValue: 0,
//         renewal: {
//           totalOrders: 0,
//           totalOrderValue: 0,
//           percentage: 0,
//         },
//         newBusiness: {
//           totalOrders: 0,
//           totalOrderValue: 0,
//           percentage: 0,
//         },
//       },
//     };

//     return res.status(200).json(
//       new ApiResponse(
//         200,
//         {
//           orderStats,
//           totalOverallResult,
//           orders: allOrders, // Include the detailed list of orders
//         },
//         "Salesman order statistics for the specified month retrieved successfully"
//       )
//     );
//   } catch (error) {
//     return next(error);
//   }
// });

// const getMonthlySalesmanOrderStats = asyncHandler(async (req, res, next) => {
//   try {
//     const user = await User.findById(req.user?._id);

//     if (!user) {
//       return next(new ApiError(403, "Unauthorized access"));
//     }

//     const { year } = req.params; // Get the year from request parameters

//     if (!year || isNaN(year) || year < 2000 || year > new Date().getFullYear()) {
//       return next(new ApiError(400, "Invalid year provided"));
//     }

//     const matchCondition = user.role === "admin" ? {} : { createdBy: req.user._id };

//     const orderStats = await Order.aggregate([
//       {
//         $match: {
//           ...matchCondition,
//           dateOfOrder: { // Ensure dateOfOrder is within the specified year
//             $gte: new Date(`${year}-01-01T00:00:00Z`),
//             $lt: new Date(`${Number(year) + 1}-01-01T00:00:00Z`),
//           },
//         },
//       },
//       {
//         $lookup: {
//           from: "users", // Assuming "users" is the collection for salesmen
//           localField: "createdBy",
//           foreignField: "_id",
//           as: "salesmanDetails",
//         },
//       },
//       {
//         $unwind: {
//           path: "$salesmanDetails",
//           preserveNullAndEmptyArrays: true, // Include orders with no associated salesman
//         },
//       },
//       {
//         $group: {
//           _id: {
//             month: { $month: "$dateOfOrder" }, // Group by month
//             orderType: "$orderType", // Group by order type
//             salesmanId: "$createdBy" // Include salesman ID for grouping
//           },
//           totalOrderValue: { $sum: "$orderValue" },
//           totalOrders: { $count: {} },
//           salesmanDetails: { $first: "$salesmanDetails" }, // Get the salesman details
//         },
//       },
//       {
//         $group: {
//           _id: "$_id.month", // Regroup by month
//           orderTypes: {
//             $push: {
//               orderType: "$_id.orderType",
//               totalOrderValue: "$totalOrderValue",
//               totalOrders: "$totalOrders",
//               salesman: {
//                 salesmanId: "$salesmanDetails._id",
//                 salesmanName: "$salesmanDetails.fullName",
//                 salesmanAvatar: "$salesmanDetails.avatar",
//                 orderValue: "$totalOrderValue",
//                 orderCount: "$totalOrders",
//               },
//             },
//           },
//           totalMonthlyValue: { $sum: "$totalOrderValue" },
//           totalMonthlyOrders: { $sum: "$totalOrders" },
//         },
//       },
//       {
//         $sort: { _id: 1 }, // Sort by month
//       },
//       {
//         $project: {
//           month: "$_id",
//           totalMonthlyValue: 1,
//           totalMonthlyOrders: 1,
//           orderTypes: {
//             $arrayToObject: {
//               $map: {
//                 input: "$orderTypes",
//                 as: "ot",
//                 in: {
//                   k: "$$ot.orderType",
//                   v: {
//                     totalOrderValue: "$$ot.totalOrderValue",
//                     totalOrders: "$$ot.totalOrders",
//                     salesman: {
//                       salesmanId: "$$ot.salesman.salesmanId",
//                       salesmanName: "$$ot.salesman.salesmanName",
//                       salesmanAvatar: "$$ot.salesman.salesmanAvatar",
//                       orderValue: "$$ot.salesman.orderValue",
//                       orderCount: "$$ot.salesman.orderCount",
//                     },
//                     percentage: {
//                       $multiply: [
//                         { $divide: ["$$ot.totalOrders", "$totalMonthlyOrders"] },
//                         100,
//                       ],
//                     },
//                   },
//                 },
//               },
//             },
//           },
//         },
//       },
//     ]);

//     // Calculate total overall for all salesmen for the given year
//     const totalOverall = await Order.aggregate([
//       {
//         $match: {
//           dateOfOrder: {
//             $gte: new Date(`${year}-01-01T00:00:00Z`),
//             $lt: new Date(`${Number(year) + 1}-01-01T00:00:00Z`),
//           },
//         },
//       },
//       {
//         $group: {
//           _id: null,
//           renewalOrders: {
//             $sum: {
//               $cond: [{ $eq: ["$orderType", "Renewal"] }, 1, 0],
//             },
//           },
//           newBusinessOrders: {
//             $sum: {
//               $cond: [{ $eq: ["$orderType", "New Business"] }, 1, 0],
//             },
//           },
//           totalRenewalValue: {
//             $sum: {
//               $cond: [{ $eq: ["$orderType", "Renewal"] }, "$orderValue", 0],
//             },
//           },
//           totalNewBusinessValue: {
//             $sum: {
//               $cond: [{ $eq: ["$orderType", "New Business"] }, "$orderValue", 0],
//             },
//           },
//         },
//       },
//       {
//         $project: {
//           _id: 0,
//           overall: {
//             totalOrders: { $add: ["$renewalOrders", "$newBusinessOrders"] },
//             totalOrderValue: { $add: ["$totalRenewalValue", "$totalNewBusinessValue"] },
//             renewal: {
//               totalOrders: "$renewalOrders",
//               totalOrderValue: "$totalRenewalValue",
//               percentage: {
//                 $multiply: [
//                   {
//                     $divide: [
//                       "$renewalOrders",
//                       { $add: ["$renewalOrders", "$newBusinessOrders"] },
//                     ],
//                   },
//                   100,
//                 ],
//               },
//             },
//             newBusiness: {
//               totalOrders: "$newBusinessOrders",
//               totalOrderValue: "$totalNewBusinessValue",
//               percentage: {
//                 $multiply: [
//                   {
//                     $divide: [
//                       "$newBusinessOrders",
//                       { $add: ["$renewalOrders", "$newBusinessOrders"] },
//                     ],
//                   },
//                   100,
//                 ],
//               },
//             },
//           },
//         },
//       },
//     ]);

//     const totalOverallResult = totalOverall.length ? totalOverall[0] : {
//       overall: {
//         totalOrders: 0,
//         totalOrderValue: 0,
//         renewal: {
//           totalOrders: 0,
//           totalOrderValue: 0,
//           percentage: 0,
//         },
//         newBusiness: {
//           totalOrders: 0,
//           totalOrderValue: 0,
//           percentage: 0,
//         },
//       },
//     };

//     return res.status(200).json(
//       new ApiResponse(
//         200,
//         {
//           orderStats,
//           totalOverallResult,
//         },
//         "Monthly salesman order statistics retrieved successfully"
//       )
//     );
//   } catch (error) {
//     return next(error);
//   }
// });

// const getMonthlySalesmanOrderStats = asyncHandler(async (req, res, next) => {
//   try {
//     const user = await User.findById(req.user?._id);

//     if (!user) {
//       return next(new ApiError(403, "Unauthorized access"));
//     }

//     const { year } = req.params; // Get the year from request parameters

//     if (!year || isNaN(year) || year < 2000 || year > new Date().getFullYear()) {
//       return next(new ApiError(400, "Invalid year provided"));
//     }

//     const matchCondition = user.role === "admin" ? {} : { createdBy: req.user._id };

//     const orderStats = await Order.aggregate([
//       {
//         $match: {
//           ...matchCondition,
//           dateOfOrder: { // Ensure dateOfOrder is within the specified year
//             $gte: new Date(`${year}-01-01T00:00:00Z`),
//             $lt: new Date(`${Number(year) + 1}-01-01T00:00:00Z`),
//           },
//         },
//       },
//       {
//         $group: {
//           _id: {
//             month: { $month: "$dateOfOrder" }, // Group by month
//             orderType: "$orderType", // Group by order type
//           },
//           totalOrderValue: { $sum: "$orderValue" },
//           totalOrders: { $count: {} },
//         },
//       },
//       {
//         $group: {
//           _id: "$_id.month", // Regroup by month
//           orderTypes: {
//             $push: {
//               orderType: "$_id.orderType",
//               totalOrderValue: "$totalOrderValue",
//               totalOrders: "$totalOrders",
//             },
//           },
//           totalMonthlyValue: { $sum: "$totalOrderValue" },
//           totalMonthlyOrders: { $sum: "$totalOrders" },
//         },
//       },
//       {
//         $sort: { _id: 1 }, // Sort by month
//       },
//       {
//         $project: {
//           month: "$_id",
//           totalMonthlyValue: 1,
//           totalMonthlyOrders: 1,
//           orderTypes: {
//             $arrayToObject: {
//               $map: {
//                 input: "$orderTypes",
//                 as: "ot",
//                 in: {
//                   k: "$$ot.orderType",
//                   v: {
//                     totalOrderValue: "$$ot.totalOrderValue",
//                     totalOrders: "$$ot.totalOrders",
//                     percentage: {
//                       $multiply: [
//                         { $divide: ["$$ot.totalOrders", "$totalMonthlyOrders"] },
//                         100,
//                       ],
//                     },
//                   },
//                 },
//               },
//             },
//           },
//         },
//       },
//     ]);

//     // Calculate total overall for all salesmen for the given year
//     const totalOverall = await Order.aggregate([
//       {
//         $match: {
//           dateOfOrder: {
//             $gte: new Date(`${year}-01-01T00:00:00Z`),
//             $lt: new Date(`${Number(year) + 1}-01-01T00:00:00Z`),
//           },
//         },
//       },
//       {
//         $group: {
//           _id: null,
//           renewalOrders: {
//             $sum: {
//               $cond: [{ $eq: ["$orderType", "Renewal"] }, 1, 0],
//             },
//           },
//           newBusinessOrders: {
//             $sum: {
//               $cond: [{ $eq: ["$orderType", "New Business"] }, 1, 0],
//             },
//           },
//           totalRenewalValue: {
//             $sum: {
//               $cond: [{ $eq: ["$orderType", "Renewal"] }, "$orderValue", 0],
//             },
//           },
//           totalNewBusinessValue: {
//             $sum: {
//               $cond: [{ $eq: ["$orderType", "New Business"] }, "$orderValue", 0],
//             },
//           },
//         },
//       },
//       {
//         $project: {
//           _id: 0,
//           overall: {
//             totalOrders: { $add: ["$renewalOrders", "$newBusinessOrders"] },
//             totalOrderValue: { $add: ["$totalRenewalValue", "$totalNewBusinessValue"] },
//             renewal: {
//               totalOrders: "$renewalOrders",
//               totalOrderValue: "$totalRenewalValue",
//               percentage: {
//                 $multiply: [
//                   {
//                     $divide: [
//                       "$renewalOrders",
//                       { $add: ["$renewalOrders", "$newBusinessOrders"] },
//                     ],
//                   },
//                   100,
//                 ],
//               },
//             },
//             newBusiness: {
//               totalOrders: "$newBusinessOrders",
//               totalOrderValue: "$totalNewBusinessValue",
//               percentage: {
//                 $multiply: [
//                   {
//                     $divide: [
//                       "$newBusinessOrders",
//                       { $add: ["$renewalOrders", "$newBusinessOrders"] },
//                     ],
//                   },
//                   100,
//                 ],
//               },
//             },
//           },
//         },
//       },
//     ]);

//     const totalOverallResult = totalOverall.length ? totalOverall[0] : {
//       overall: {
//         totalOrders: 0,
//         totalOrderValue: 0,
//         renewal: {
//           totalOrders: 0,
//           totalOrderValue: 0,
//           percentage: 0,
//         },
//         newBusiness: {
//           totalOrders: 0,
//           totalOrderValue: 0,
//           percentage: 0,
//         },
//       },
//     };

//     return res.status(200).json(
//       new ApiResponse(
//         200,
//         {
//           orderStats,
//           totalOverallResult,
//         },
//         "Monthly salesman order statistics retrieved successfully"
//       )
//     );
//   } catch (error) {
//     return next(error);
//   }
// });
