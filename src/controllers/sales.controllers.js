import { asyncHandler } from "../utils/asyncHandler.js";
import Order from "../models/order.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import mongoose from "mongoose";


const getSalesmanOrderStat = asyncHandler(async (req, res, next) => {
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
//***************************** START FINAL API ******** */
const getSalesmanOrderStats = asyncHandler(async (req, res, next) => {
  try {
    const { year } = req.query;

    if (!year) {
      return next(new ApiError(400, "Year is required"));
    }

    const user = await User.findById(req.user?._id);
    if (!user) {
      return next(new ApiError(403, "Unauthorized access"));
    }

    const [startDate, endDate] = getStartAndEndDates(year);
    const matchCondition = user.role === "admin" ? {} : { createdBy: req.user._id };

    const orders = await getOrdersWithPopulate(matchCondition, startDate, endDate);
    const orderStats = await calculateOrderStats(orders);
    const totalOverallResult = calculateTotalOverallResult(orderStats);

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

// Helper functions
function getStartAndEndDates(year) {
  const startDate = new Date(year, 0, 1); // January 1st of the given year
  const endDate = new Date(year + 1, 0, 1); // January 1st of the following year
  return [startDate, endDate];
}

async function getOrdersWithPopulate(matchCondition, startDate, endDate) {
  return await Order.find({
    ...matchCondition,
    dateOfOrder: {
      $gte: startDate,
      $lt: endDate,
    },
  })
  .populate('createdBy', 'fullName avatar')
  .exec();
}

async function calculateOrderStats(orders) {
  const orderStats = {};

  for (const order of orders) {
    if (!order.createdBy) {
      continue;
    }

    const salesmanId = order.createdBy._id.toString();
    const orderType = order.orderType;

    if (!orderStats[salesmanId]) {
      orderStats[salesmanId] = {
        salesmanId,
        salesmanName: order.createdBy.fullName,
        salesmanAvatar: order.createdBy.avatar,
        totalOrderValue: 0,
        totalOrders: 0,
        orderTypes: {
          Renewal: { totalOrderValue: 0, totalOrders: 0 },
          "New Business": { totalOrderValue: 0, totalOrders: 0 },
        },
      };
    }

    orderStats[salesmanId].totalOrderValue += order.orderValue || 0;
    orderStats[salesmanId].totalOrders += 1;

    if (orderStats[salesmanId].orderTypes[orderType]) {
      orderStats[salesmanId].orderTypes[orderType].totalOrderValue += order.orderValue || 0;
      orderStats[salesmanId].orderTypes[orderType].totalOrders += 1;
    }
  }

  return Object.values(orderStats);
}

function calculateTotalOverallResult(orderStats) {
  let totalSalesmanValue = 0;
  let totalSalesmanOrders = 0;

  const renewal = {
    totalOrders: 0,
    totalOrderValue: 0,
  };

  const newBusiness = {
    totalOrders: 0,
    totalOrderValue: 0,
  };

  for (const stat of orderStats) {
    totalSalesmanValue += stat.totalOrderValue;
    totalSalesmanOrders += stat.totalOrders;

    renewal.totalOrders += stat.orderTypes.Renewal.totalOrders;
    renewal.totalOrderValue += stat.orderTypes.Renewal.totalOrderValue;

    newBusiness.totalOrders += stat.orderTypes["New Business"].totalOrders;
    newBusiness.totalOrderValue += stat.orderTypes["New Business"].totalOrderValue;
  }

  return {
    overall: {
      totalOrders: totalSalesmanOrders,
      totalOrderValue: totalSalesmanValue,
      renewal,
      newBusiness,
    },
  };
}
// const getSalesmanOrderStats = asyncHandler(async (req, res, next) => {
//   try {
//     const { year } = req.query;

//     if (!year) {
//       return next(new ApiError(400, "Year is required"));
//     }

//     const user = await User.findById(req.user?._id);
//     if (!user) {
//       return next(new ApiError(403, "Unauthorized access"));
//     }

//     // Convert year to start and end date for querying
//     const startDate = new Date(year, 0, 1); // January 1st of the given year
//     const endDate = new Date(year + 1, 0, 1); // January 1st of the following year

//     // Match orders based on user role
//     const matchCondition = user.role === "admin" ? {} : { createdBy: req.user._id };

//     // Fetch orders with populate
//     const orders = await Order.find({
//       ...matchCondition,
//       dateOfOrder: {
//         $gte: startDate,
//         $lt: endDate,
//       },
//     })
//     .populate('createdBy', 'fullName avatar') // Populate the createdBy field
//     .exec();

//     // Process the orders to gather statistics
//     const orderStats = {};
//     let totalSalesmanValue = 0;
//     let totalSalesmanOrders = 0;

//     orders.forEach(order => {
//       if (!order.createdBy) {
//         // If createdBy is null, skip this order
//         return;
//       }

//       const salesmanId = order.createdBy._id.toString(); // Convert to string for consistency
//       const orderType = order.orderType;

//       // Initialize the stats for this salesman if not already done
//       if (!orderStats[salesmanId]) {
//         orderStats[salesmanId] = {
//           salesmanId: salesmanId,
//           salesmanName: order.createdBy.fullName,
//           salesmanAvatar: order.createdBy.avatar,
//           totalOrderValue: 0,
//           totalOrders: 0,
//           orderTypes: {
//             Renewal: { totalOrderValue: 0, totalOrders: 0 },
//             "New Business": { totalOrderValue: 0, totalOrders: 0 },
//           },
//         };
//       }

//       // Update the stats
//       orderStats[salesmanId].totalOrderValue += order.orderValue || 0; // Safeguard against undefined
//       orderStats[salesmanId].totalOrders += 1;

//       // Check if the order type exists and update
//       if (orderStats[salesmanId].orderTypes[orderType]) {
//         orderStats[salesmanId].orderTypes[orderType].totalOrderValue += order.orderValue || 0;
//         orderStats[salesmanId].orderTypes[orderType].totalOrders += 1;
//       }

//       // Aggregate totals for overall stats
//       totalSalesmanValue += order.orderValue || 0; // Safeguard against undefined
//       totalSalesmanOrders += 1;
//     });

//     // Convert orderStats object to array
//     const orderStatsArray = Object.values(orderStats);

//     // Calculate overall statistics
//     const totalOverallResult = {
//       overall: {
//         totalOrders: totalSalesmanOrders,
//         totalOrderValue: totalSalesmanValue,
//         renewal: {
//           totalOrders: orderStatsArray.reduce((acc, stat) => acc + (stat.orderTypes.Renewal?.totalOrders || 0), 0),
//           totalOrderValue: orderStatsArray.reduce((acc, stat) => acc + (stat.orderTypes.Renewal?.totalOrderValue || 0), 0),
//         },
//         newBusiness: {
//           totalOrders: orderStatsArray.reduce((acc, stat) => acc + (stat.orderTypes["New Business"]?.totalOrders || 0), 0),
//           totalOrderValue: orderStatsArray.reduce((acc, stat) => acc + (stat.orderTypes["New Business"]?.totalOrderValue || 0), 0),
//         },
//       },
//     };

//     return res.status(200).json(
//       new ApiResponse(
//         200,
//         {
//           orderStats: orderStatsArray,
//           totalOverallResult,
//         },
//         "Salesman order statistics retrieved successfully"
//       )
//     );
//   } catch (error) {
//     return next(error);
//   }
// });
const getMonthStatus = asyncHandler(async (req, res) => {
  const { month, year } = req.query;
  const { role, id: userId, avatar } = req.user;

  if (!month || !year) {
    throw new ApiError(400, 'Month and Year are required.');
  }

  const monthInt = parseInt(month, 10);
  const yearInt = parseInt(year, 10);

  if (isNaN(monthInt) || isNaN(yearInt) || monthInt < 1 || monthInt > 12) {
    throw new ApiError(400, 'Invalid month or year.');
  }

  const startDate = new Date(yearInt, monthInt - 1, 1);
  const endDate = new Date(yearInt, monthInt, 1);

  // Define query for total orders
  const totalOrdersQuery = {
    dateOfOrder: { $gte: startDate, $lt: endDate },
  };

  if (role === 'salesman') {
    totalOrdersQuery.createdBy = userId;
  }

  // Fetching total orders
  const totalOrders = await Order.find(totalOrdersQuery)
    .populate({
      path: 'createdBy',
      select: 'fullName avatar',
    });

  // Calculate total order values
  const totalOrderValue = totalOrders.reduce((acc, order) => acc + order.orderValue, 0);
  const totalOrderCount = totalOrders.length;

  // Define query for renewals
  const renewalQuery = {
    orderType: "Renewal",
    dateOfOrder: { $gte: startDate, $lt: endDate },
  };

  if (role === 'salesman') {
    renewalQuery.createdBy = userId;
  }

  const renewals = await Order.find(renewalQuery)
    .populate('createdBy', 'fullName avatar');

  const renewalResponse = renewals.reduce((acc, order) => {
    const userInfo = order.createdBy || {};
    const existing = acc.find(item => item.userId && item.userId.equals(userInfo._id));

    if (existing) {
      existing.totalOrderValue += order.orderValue;
      existing.count += 1;
    } else {
      acc.push({
        userId: userInfo._id || null,
        userName: userInfo.fullName || "Unknown User",
        avatar: userInfo.avatar || null,
        totalOrderValue: order.orderValue,
        count: 1,
      });
    }
    return acc;
  }, []);

  // Define query for new business
  const newBusinessQuery = {
    orderType: "New Business",
    dateOfOrder: { $gte: startDate, $lt: endDate },
  };

  if (role === 'salesman') {
    newBusinessQuery.createdBy = userId;
  }

  const newBusinessOrders = await Order.find(newBusinessQuery)
    .populate('createdBy', 'fullName avatar');

  const newBusinessResponse = newBusinessOrders.reduce((acc, order) => {
    const userInfo = order.createdBy || {};
    const existing = acc.find(item => item.userId && item.userId.equals(userInfo._id));

    if (existing) {
      existing.totalOrderValue += order.orderValue;
      existing.count += 1;
    } else {
      acc.push({
        userId: userInfo._id || null,
        userName: userInfo.fullName || "Unknown User",
        avatar: userInfo.avatar || null,
        totalOrderValue: order.orderValue,
        count: 1,
      });
    }
    return acc;
  }, []);

  // Create final response object
  const response = {
    totalOrders: {
      totalOrderValue,
      totalOrderCount,
      orders: totalOrders,
    },
    totalRenewals: renewalResponse,
    totalNewBusiness: newBusinessResponse,
  };

  res.status(200).json(new ApiResponse(200, response, 'Monthly sales status retrieved successfully.'));
});
//***************************** ENDFINAL API ***********/



// *************   Not Usage aggerstion piPILINE */
const getThisMonthTotalSales = asyncHandler(async (req, res) => {
  const { month, year } = req.query;
  const { role, id: userId, avatar } = req.user;

  if (!month || !year) {
    throw new ApiError(400, 'Month and Year are required.');
  }

  const monthInt = parseInt(month, 10);
  const yearInt = parseInt(year, 10);

  if (isNaN(monthInt) || isNaN(yearInt) || monthInt < 1 || monthInt > 12) {
    throw new ApiError(400, 'Invalid month or year.');
  }

  const startDate = new Date(yearInt, monthInt - 1, 1);
  const endDate = new Date(yearInt, monthInt, 0, 23, 59, 59); // Last moment of the last day of the month

  let query = {
    dateOfOrder: {
      $gte: startDate,
      $lt: endDate,
    },
  };

  if (role === 'salesman') {
    query.createdBy = userId;
  }

  // Fetching matched orders and populating user info
  const matchedOrders = await Order.find(query)
    .populate({
      path: 'createdBy', // Assuming `createdBy` is the reference to the user
      select: 'fullName avatar', // Select the fields you want
    });

  const totalOrderValue = matchedOrders.reduce((acc, order) => acc + order.orderValue, 0);
  const count = matchedOrders.length;

  const response = role === 'salesman'
    ? [{
        userId,
        userName: "You",
        avatar,
        totalOrderValue,
        count,
      }]
    : matchedOrders.map(order => {
        if (order.createdBy) {
          return {
            userId: order.createdBy._id,
            userName: order.createdBy.fullName,
            avatar: order.createdBy.avatar,
            totalOrderValue: order.orderValue,
            count: 1, // Each order counts as 1
          };
        } else {
          // Handle case where createdBy is null
          return {
            userId: null,
            userName: "Unknown User",
            avatar: null,
            totalOrderValue: order.orderValue,
            count: 1,
          };
        }
      });

  // If role is admin, you might want to aggregate data by user here
  if (role === 'admin') {
    const aggregatedResponse = response.reduce((acc, curr) => {
      const existing = acc.find(item => item.userId && item.userId.equals(curr.userId));
      if (existing) {
        existing.totalOrderValue += curr.totalOrderValue;
        existing.count += curr.count;
      } else {
        acc.push(curr);
      }
      return acc;
    }, []);
    return res.status(200).json(new ApiResponse(200, aggregatedResponse, 'Total sales retrieved successfully.'));
  }

  res.status(200).json(new ApiResponse(200, response, 'Total sales retrieved successfully.'));
});
const getRenewalTotalSales = asyncHandler(async (req, res) => {
  const { month, year } = req.query;
  const { role, id: userId } = req.user;

  if (!month || !year) {
    throw new ApiError(400, 'Month and Year are required.');
  }

  const monthInt = parseInt(month, 10);
  const yearInt = parseInt(year, 10);

  if (isNaN(monthInt) || isNaN(yearInt) || monthInt < 1 || monthInt > 12) {
    throw new ApiError(400, 'Invalid month or year.');
  }

  const startDate = new Date(yearInt, monthInt - 1, 1);
  const endDate = new Date(yearInt, monthInt, 1);

  const query = {
    orderType: "Renewal",
    dateOfOrder: {
      $gte: startDate,
      $lt: endDate,
    },
  };

  if (role === 'salesman') {
    query.createdBy = userId;
  }

  const totalSales = await Order.find(query)
    .populate('createdBy', 'fullName avatar') // Populating the user info
    .exec();

  const response = totalSales.map(order => {
    // Check if createdBy is not null
    const userInfo = order.createdBy || {};
    return {
      userId: userInfo._id || null,
      userName: userInfo.fullName || "You",
      avatar: userInfo.avatar || null,
      totalOrderValue: order.orderValue,
      count: 1, // Each order counts as one
    };
  });

  // Summarize results
  const summarizedResponse = response.reduce((acc, curr) => {
    const existing = acc.find(item => item.userId && item.userId.equals(curr.userId));
    if (existing) {
      existing.totalOrderValue += curr.totalOrderValue;
      existing.count += curr.count;
    } else {
      acc.push(curr);
    }
    return acc;
  }, []);

  res.status(200).json(new ApiResponse(200, summarizedResponse, 'Renewal total sales retrieved successfully.'));
});
const getNewBusinessTotalSales = asyncHandler(async (req, res) => {
  const { month, year } = req.query;
  const { role, id: userId } = req.user;

  if (!month || !year) {
    throw new ApiError(400, 'Month and Year are required.');
  }

  const monthInt = parseInt(month, 10);
  const yearInt = parseInt(year, 10);

  if (isNaN(monthInt) || isNaN(yearInt) || monthInt < 1 || monthInt > 12) {
    throw new ApiError(400, 'Invalid month or year.');
  }

  const startDate = new Date(yearInt, monthInt - 1, 1);
  const endDate = new Date(yearInt, monthInt, 1);

  const query = {
    orderType: "New Business",
    dateOfOrder: {
      $gte: startDate,
      $lt: endDate,
    },
  };

  if (role === 'salesman') {
    query.createdBy = userId;
  }

  const totalSales = await Order.find(query)
    .populate('createdBy', 'fullName avatar') // Populating the user info
    .exec();

  const response = totalSales.map(order => {
    const userInfo = order.createdBy || {}; // Fallback to empty object if createdBy is null
    return {
      userId: userInfo._id || null,
      userName: userInfo.fullName || "You",
      avatar: userInfo.avatar || null,
      totalOrderValue: order.orderValue || 0, // Fallback to 0 if orderValue is null
      count: 1, // Assuming each order is counted as one
    };
  });

  // Summarize results
  const summarizedResponse = response.reduce((acc, curr) => {
    const existing = acc.find(item => item.userId && item.userId.equals(curr.userId));
    if (existing) {
      existing.totalOrderValue += curr.totalOrderValue;
      existing.count += curr.count;
    } else {
      acc.push(curr);
    }
    return acc;
  }, []);

  res.status(200).json(new ApiResponse(200, summarizedResponse, 'New business total sales retrieved successfully.'));
});
const getSalesMonthlyStatus = asyncHandler(async (req, res) => {
  const { month, year } = req.query;
  const { role, id: userId } = req.user;

  if (!month || !year) {
    throw new ApiError(400, 'Month and Year are required.');
  }

  const monthInt = parseInt(month, 10);
  const yearInt = parseInt(year, 10);

  if (isNaN(monthInt) || isNaN(yearInt) || monthInt < 1 || monthInt > 12) {
    throw new ApiError(400, 'Invalid month or year.');
  }

  let query = {};
  if (role === 'salesman') {
    query.createdBy = userId;
  }

  const startDate = new Date(yearInt, monthInt - 1, 1);
  const endDate = new Date(yearInt, monthInt, 1);

  query.dateOfOrder = {
    $gte: startDate,
    $lt: endDate,
  };

  const orders = await Order.find(query).populate('customer');

  res.status(200).json(new ApiResponse(200, orders, 'Orders retrieved successfully.'));
});
//*************  END  Not Usage aggerstion piPILINE */




//  const getSalesMonthlyStatus = async (req, res) => {
//   const { month, year } = req.query; // Extract month and year from query parameters
//   const { role, id: userId } = req.user; // Extract role and user ID from the request user object

//   if (!month || !year) {
//       return res.status(400).json({ message: 'Month and Year are required.' });
//   }

//   // Convert month and year to integers
//   const monthInt = parseInt(month, 10);
//   const yearInt = parseInt(year, 10);

//   // Validate month and year
//   if (isNaN(monthInt) || isNaN(yearInt) || monthInt < 1 || monthInt > 12) {
//       return res.status(400).json({ message: 'Invalid month or year.' });
//   }

//   try {
//       let query = {};

//       // Set query based on user role
//       if (role === 'salesman') {
//           query.createdBy = userId; // Filter by createdBy if the user is a salesman
//       }

//       // Add date filtering based on month and year
//       const startDate = new Date(yearInt, monthInt - 1, 1); // Start of the month
//       const endDate = new Date(yearInt, monthInt, 1); // Start of the next month

//       query.dateOfOrder = {
//           $gte: startDate,
//           $lt: endDate,
//       };

//       // Find the orders matching the query
//       const orders = await Order.find(query).populate('customer'); // Populate customer if needed

//       return res.status(200).json({ orders });
//   } catch (error) {
//       console.error(error);
//       return res.status(500).json({ message: 'Internal server error.' });
//   }
// };
// const getThisMonthTotalSales = async (req, res) => {
//   const { month, year } = req.query; // Extract month and year from query parameters
//   const { role, id: userId } = req.user; // Extract role and user ID from the request user object

//   // Validate month and year
//   if (!month || !year) {
//       return res.status(400).json({ message: 'Month and Year are required.' });
//   }

//   const monthInt = parseInt(month, 10);
//   const yearInt = parseInt(year, 10);

//   if (isNaN(monthInt) || isNaN(yearInt) || monthInt < 1 || monthInt > 12) {
//       return res.status(400).json({ message: 'Invalid month or year.' });
//   }

//   try {
//       const startDate = new Date(yearInt, monthInt - 1, 1); // Start of the specified month
//       const endDate = new Date(yearInt, monthInt, 1); // Start of the next month

//       let query = {};

//       if (role === 'salesman') {
//           query.createdBy = userId; // Filter by createdBy for salesman
//       }

//       query.dateOfOrder = {
//           $gte: startDate,
//           $lt: endDate,
//       };

//       // Aggregate total order value
//       const totalSales = await Order.aggregate([
//           { $match: query },
//           { $group: { _id: role === 'admin' ? "$createdBy" : null, totalOrderValue: { $sum: "$orderValue" } } },
//           {
//               $lookup: {
//                   from: "users", // Assuming your users collection is named 'users'
//                   localField: "_id",
//                   foreignField: "_id",
//                   as: "userInfo"
//               }
//           },
//           {
//               $unwind: {
//                   path: "$userInfo",
//                   preserveNullAndEmptyArrays: true
//               }
//           },
//           {
//               $project: {
//                   _id: 0,
//                   userId: role === 'admin' ? "$_id" : mongoose.Types.ObjectId(userId),
//                   userName: role === 'admin' ? "$userInfo.fullName" : "You", // Use fullname instead of name
//                   avatar: role === 'admin' ? "$userInfo.avatar" : null, // Include avatar
//                   totalOrderValue: 1
//               }
//           }
//       ]);

//       // If the user is a salesman, only return their total sales
//       const response = role === 'salesman' 
//           ? [{ userId: userId, userName: "You", avatar: req.user.avatar, totalOrderValue: totalSales[0]?.totalOrderValue || 0 }] // Use req.user.avatar
//           : totalSales;

//       return res.status(200).json({ totalSales: response });
//   } catch (error) {
//       console.error(error);
//       return res.status(500).json({ message: 'Internal server error.' });
//   }
// };
// const getNewBusinessTotalSales = async (req, res) => {
//   const { month, year } = req.query; // Extract month and year from query parameters
//   const { role, id: userId } = req.user; // Extract role and user ID from the request user object

//   // Validate month and year
//   if (!month || !year) {
//       return res.status(400).json({ message: 'Month and Year are required.' });
//   }

//   const monthInt = parseInt(month, 10);
//   const yearInt = parseInt(year, 10);

//   if (isNaN(monthInt) || isNaN(yearInt) || monthInt < 1 || monthInt > 12) {
//       return res.status(400).json({ message: 'Invalid month or year.' });
//   }

//   try {
//       const startDate = new Date(yearInt, monthInt - 1, 1); // Start of the specified month
//       const endDate = new Date(yearInt, monthInt, 1); // Start of the next month

//       let query = {
//           orderType: "New Business", // Filter for orderType
//       };

//       if (role === 'salesman') {
//           query.createdBy = userId; // Filter by createdBy for salesman
//       }

//       query.dateOfOrder = {
//           $gte: startDate,
//           $lt: endDate,
//       };

//       // Aggregate total order value for New Business and populate user information
//       const totalSales = await Order.aggregate([
//           { $match: query },
//           { $group: { _id: role === 'admin' ? "$createdBy" : userId, totalOrderValue: { $sum: "$orderValue" } } },
//           {
//               $lookup: {
//                   from: "users", // Assuming your users collection is named 'users'
//                   localField: "_id",
//                   foreignField: "_id",
//                   as: "userInfo"
//               }
//           },
//           {
//               $unwind: {
//                   path: "$userInfo",
//                   preserveNullAndEmptyArrays: true
//               }
//           },
//           {
//               $project: {
//                   _id: 0,
//                   userId: "$_id",
//                   userName: { $ifNull: ["$userInfo.fullname", "You"] }, // Use fullname instead of name
//                   avatar: { $ifNull: ["$userInfo.avatar", null] }, // Include avatar
//                   totalOrderValue: 1
//               }
//           }
//       ]);

//       // If the user is a salesman, only return their total sales
//       const response = role === 'salesman' 
//           ? [{ userId: userId, userName: "You", avatar: req.user.avatar, totalOrderValue: totalSales[0]?.totalOrderValue || 0 }] // Use req.user.avatar
//           : totalSales;

//       return res.status(200).json({ totalSales: response });
//   } catch (error) {
//       console.error(error);
//       return res.status(500).json({ message: 'Internal server error.' });
//   }
// };
//  const getRenewalTotalSales = async (req, res) => {
//   const { month, year } = req.query; // Extract month and year from query parameters
//   const { role, id: userId } = req.user; // Extract role and user ID from the request user object

//   // Validate month and year
//   if (!month || !year) {
//       return res.status(400).json({ message: 'Month and Year are required.' });
//   }

//   const monthInt = parseInt(month, 10);
//   const yearInt = parseInt(year, 10);

//   if (isNaN(monthInt) || isNaN(yearInt) || monthInt < 1 || monthInt > 12) {
//       return res.status(400).json({ message: 'Invalid month or year.' });
//   }

//   try {
//       const startDate = new Date(yearInt, monthInt - 1, 1); // Start of the specified month
//       const endDate = new Date(yearInt, monthInt, 1); // Start of the next month

//       let query = {
//           orderType: "Renewal", // Filter for orderType
//       };

//       if (role === 'salesman') {
//           query.createdBy = userId; // Filter by createdBy for salesman
//       }

//       query.dateOfOrder = {
//           $gte: startDate,
//           $lt: endDate,
//       };

//       // Aggregate total order value for Renewal and populate user information
//       const totalSales = await Order.aggregate([
//           { $match: query },
//           { $group: { _id: role === 'admin' ? "$createdBy" : userId, totalOrderValue: { $sum: "$orderValue" } } },
//           {
//               $lookup: {
//                   from: "users", // Assuming your users collection is named 'users'
//                   localField: "_id",
//                   foreignField: "_id",
//                   as: "userInfo"
//               }
//           },
//           {
//               $unwind: {
//                   path: "$userInfo",
//                   preserveNullAndEmptyArrays: true
//               }
//           },
//           {
//               $project: {
//                   _id: 0,
//                   userId: "$_id",
//                   userName: { $ifNull: ["$userInfo.fullName", "You"] }, // Use fullname instead of name
//                   avatar: { $ifNull: ["$userInfo.avatar", null] }, // Include avatar
//                   totalOrderValue: 1
//               }
//           }
//       ]);

//       // If the user is a salesman, only return their total sales
//       const response = role === 'salesman' 
//           ? [{ userId: userId, userName: "You", avatar: req.user.avatar, totalOrderValue: totalSales[0]?.totalOrderValue || 0 }] // Use req.user.avatar
//           : totalSales;

//       return res.status(200).json({ totalSales: response });
//   } catch (error) {
//       console.error(error);
//       return res.status(500).json({ message: 'Internal server error.' });
//   }
// };
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
  getThisMonthTotalSales,
  getNewBusinessTotalSales,
  getRenewalTotalSales,
  getSalesMonthlyStatus,
  getMonthStatus
};


// const getThisMonthTotalSales = asyncHandler(async (req, res) => {
//   const { month, year } = req.query;
//   const { role, id: userId, avatar } = req.user;

//   if (!month || !year) {
//     throw new ApiError(400, 'Month and Year are required.');
//   }

//   const monthInt = parseInt(month, 10);
//   const yearInt = parseInt(year, 10);

//   if (isNaN(monthInt) || isNaN(yearInt) || monthInt < 1 || monthInt > 12) {
//     throw new ApiError(400, 'Invalid month or year.');
//   }

//   const startDate = new Date(yearInt, monthInt - 1, 1);
//   const endDate = new Date(yearInt, monthInt, 0, 23, 59, 59); // Last moment of the last day of the month

//   let query = {
//     dateOfOrder: {
//       $gte: startDate,
//       $lt: endDate,
//     },
//   };

//   if (role === 'salesman') {
//     query.createdBy = userId;
//   }

//   // Fetching matched orders
//   const matchedOrders = await Order.find(query);
//   console.log("Matched Orders Count:", matchedOrders.length);
//   console.log("Matched Orders:", matchedOrders);

//   // Aggregation pipeline for total sales
//   const totalSales = await Order.aggregate([
//     { $match: query },
//     { 
//       $group: { 
//         _id: role === 'admin' ? "$createdBy" : userId, 
//         totalOrderValue: { $sum: "$orderValue" },
//         count: { $sum: 1 }
//       } 
//     },
//     {
//       $lookup: {
//         from: "users",
//         localField: "_id",
//         foreignField: "_id",
//         as: "userInfo"
//       }
//     },
//     {
//       $unwind: {
//         path: "$userInfo",
//         preserveNullAndEmptyArrays: true
//       }
//     },
//     {
//       $project: {
//         _id: 0,
//         userId: role === 'admin' ? "$_id" : userId,
//         userName: role === 'admin' ? "$userInfo.fullName" : "You",
//         avatar: role === 'admin' ? "$userInfo.avatar" : avatar,
//         totalOrderValue: 1,
//         count: 1
//       }
//     }
//   ]);

//   const response = role === 'salesman' 
//     ? [{ userId, userName: "You", avatar, totalOrderValue: totalSales[0]?.totalOrderValue || 0, count: totalSales[0]?.count || 0 }]
//     : totalSales;

//   res.status(200).json(new ApiResponse(200, response, 'Total sales retrieved successfully.'));
// });



// const getThisMonthTotalSales = asyncHandler(async (req, res) => {
//   const { month, year } = req.query;
//   const { role, id: userId } = req.user;

//   if (!month || !year) {
//     throw new ApiError(400, 'Month and Year are required.');
//   }

//   const monthInt = parseInt(month, 10);
//   const yearInt = parseInt(year, 10);

//   if (isNaN(monthInt) || isNaN(yearInt) || monthInt < 1 || monthInt > 12) {
//     throw new ApiError(400, 'Invalid month or year.');
//   }

//   const startDate = new Date(yearInt, monthInt - 1, 1);
//   const endDate = new Date(yearInt, monthInt, 1);

//   let query = {
//     dateOfOrder: {
//       $gte: startDate,
//       $lt: endDate,
//     },
//   };

//   if (role === 'salesman') {
//     query.createdBy = userId;
//   }
//   console.log("Query:", JSON.stringify(query));
//   // const matchedOrders = await Order.find(query);
//   // console.log("Matched Orders Count:", matchedOrders.length);
//   // console.log("Matched Orders:", matchedOrders);
//   const orders = await Order.find(query).select('orderValue dateOfOrder createdBy');
// console.log("Orders with orderValue:", orders);

  
//   const totalSales = await Order.aggregate([
//     { $match: query },
//     { 
//       $group: { 
//         _id: role === 'admin' ? "$createdBy" : userId, 
//         totalOrderValue: { $sum: "$orderValue" }, // Ensure this is the correct field
//         count: { $sum: 1 }
//       } 
//     },
//     {
//       $lookup: {
//         from: "users",
//         localField: "_id",
//         foreignField: "_id",
//         as: "userInfo"
//       }
//     },
//     {
//       $unwind: {
//         path: "$userInfo",
//         preserveNullAndEmptyArrays: true
//       }
//     },
//     {
//       $project: {
//         _id: 0,
//         userId: role === 'admin' ? "$_id" : mongoose.Types.ObjectId(userId),
//         userName: role === 'admin' ? "$userInfo.fullName" : "You",
//         avatar: role === 'admin' ? "$userInfo.avatar" : null,
//         totalOrderValue: 1,
//         count: 1
//       }
//     }
//   ]);

//   const response = role === 'salesman' 
//     ? [{ userId: userId, userName: "You", avatar: req.user.avatar, totalOrderValue: totalSales[0]?.totalOrderValue || 0, count: totalSales[0]?.count || 0 }]
//     : totalSales;

//   res.status(200).json(new ApiResponse(200, response, 'Total sales retrieved successfully.'));
// });


// const getThisMonthTotalSales = asyncHandler(async (req, res) => {
//   const { month, year } = req.query;
//   const { role, id: userId } = req.user;

//   if (!month || !year) {
//     throw new ApiError(400, 'Month and Year are required.');
//   }

//   const monthInt = parseInt(month, 10);
//   const yearInt = parseInt(year, 10);

//   if (isNaN(monthInt) || isNaN(yearInt) || monthInt < 1 || monthInt > 12) {
//     throw new ApiError(400, 'Invalid month or year.');
//   }

//   const startDate = new Date(yearInt, monthInt - 1, 1);
//   const endDate = new Date(yearInt, monthInt, 1);
//   console.log("start date",startDate,endDate);
  

//   let query = {};
//   if (role === 'salesman') {
//     query.createdBy = userId;
//   }

//   query.dateOfOrder = {
//     $gte: startDate,
//     $lt: endDate,
//   };

//   const totalSales = await Order.aggregate([
//     { $match: query },
//     { $group: { _id: role === 'admin' ? "$createdBy" : null, totalOrderValue: { $sum: "$orderValue" } } },
//     {
//       $lookup: {
//         from: "users",
//         localField: "_id",
//         foreignField: "_id",
//         as: "userInfo"
//       }
//     },
//     {
//       $unwind: {
//         path: "$userInfo",
//         preserveNullAndEmptyArrays: true
//       }
//     },
//     {
//       $project: {
//         _id: 0,
//         userId: role === 'admin' ? "$_id" : mongoose.Types.ObjectId(userId),
//         userName: role === 'admin' ? "$userInfo.fullName" : "You",
//         avatar: role === 'admin' ? "$userInfo.avatar" : null,
//         totalOrderValue: 1
//       }
//     }
//   ]);
//  console.log("total sales",totalSales);
 
//   const response = role === 'salesman' 
//     ? [{ userId: userId, userName: "You", avatar: req.user.avatar, totalOrderValue: totalSales[0]?.totalOrderValue || 0 }]
//     : totalSales;

//   res.status(200).json(new ApiResponse(200, response, 'Total sales retrieved successfully.'));
// });
// const getNewBusinessTotalSales = asyncHandler(async (req, res) => {
//   const { month, year } = req.query;
//   const { role, id: userId } = req.user;

//   if (!month || !year) {
//     throw new ApiError(400, 'Month and Year are required.');
//   }

//   const monthInt = parseInt(month, 10);
//   const yearInt = parseInt(year, 10);

//   if (isNaN(monthInt) || isNaN(yearInt) || monthInt < 1 || monthInt > 12) {
//     throw new ApiError(400, 'Invalid month or year.');
//   }

//   const startDate = new Date(yearInt, monthInt - 1, 1);
//   const endDate = new Date(yearInt, monthInt, 1);

//   let query = {
//     orderType: "New Business",
//   };

//   if (role === 'salesman') {
//     query.createdBy = userId;
//   }

//   query.dateOfOrder = {
//     $gte: startDate,
//     $lt: endDate,
//   };

//   const totalSales = await Order.aggregate([
//     { $match: query },
//     { $group: { _id: role === 'admin' ? "$createdBy" : userId, totalOrderValue: { $sum: "$orderValue" }, count: { $sum: 1 } } },
//     {
//       $lookup: {
//         from: "users",
//         localField: "_id",
//         foreignField: "_id",
//         as: "userInfo"
//       }
//     },
//     {
//       $unwind: {
//         path: "$userInfo",
//         preserveNullAndEmptyArrays: true
//       }
//     },
//     {
//       $project: {
//         _id: 0,
//         userId: "$_id",
//         userName: { $ifNull: ["$userInfo.fullName", "You"] },
//         avatar: { $ifNull: ["$userInfo.avatar", null] },
//         totalOrderValue: 1,
//         count: 1
//       }
//     }
//   ]);

//   const response = role === 'salesman' 
//     ? [{ userId: userId, userName: "You", avatar: req.user.avatar, totalOrderValue: totalSales[0]?.totalOrderValue || 0, count: totalSales[0]?.count || 0 }]
//     : totalSales;

//   res.status(200).json(new ApiResponse(200, response, 'New business total sales retrieved successfully.'));
// });



// const getRenewalTotalSales = asyncHandler(async (req, res) => {
//   const { month, year } = req.query;
//   const { role, id: userId } = req.user;

//   if (!month || !year) {
//     throw new ApiError(400, 'Month and Year are required.');
//   }

//   const monthInt = parseInt(month, 10);
//   const yearInt = parseInt(year, 10);

//   if (isNaN(monthInt) || isNaN(yearInt) || monthInt < 1 || monthInt > 12) {
//     throw new ApiError(400, 'Invalid month or year.');
//   }

//   const startDate = new Date(yearInt, monthInt - 1, 1);
//   const endDate = new Date(yearInt, monthInt, 1);

//   let query = {
//     orderType: "Renewal",
//   };

//   if (role === 'salesman') {
//     query.createdBy = userId;
//   }

//   query.dateOfOrder = {
//     $gte: startDate,
//     $lt: endDate,
//   };

//   const totalSales = await Order.aggregate([
//     { $match: query },
//     { $group: { _id: role === 'admin' ? "$createdBy" : userId, totalOrderValue: { $sum: "$orderValue" }, count: { $sum: 1 } } },
//     {
//       $lookup: {
//         from: "users",
//         localField: "_id",
//         foreignField: "_id",
//         as: "userInfo"
//       }
//     },
//     {
//       $unwind: {
//         path: "$userInfo",
//         preserveNullAndEmptyArrays: true
//       }
//     },
//     {
//       $project: {
//         _id: 0,
//         userId: "$_id",
//         userName: { $ifNull: ["$userInfo.fullName", "You"] },
//         avatar: { $ifNull: ["$userInfo.avatar", null] },
//         totalOrderValue: 1,
//         count: 1
//       }
//     }
//   ]);

//   const response = role === 'salesman' 
//     ? [{ userId: userId, userName: "You", avatar: req.user.avatar, totalOrderValue: totalSales[0]?.totalOrderValue || 0, count: totalSales[0]?.count || 0 }]
//     : totalSales;

//   res.status(200).json(new ApiResponse(200, response, 'Renewal total sales retrieved successfully.'));
// });













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
