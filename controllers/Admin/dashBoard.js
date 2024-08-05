const Agent = require("../../models/agents");
const Head = require("../../models/districtHead");
const Trees = require("../../models/section");
const District = require("../../models/district");

const countData = async (req, res) => {
  try {
    const treesCount = await Trees.countDocuments({});
    const districtCount = await District.countDocuments({});
    const approvedAgentCount = await Agent.countDocuments({
      status: "Approved",
    });
    const incompleteTreeResult = await Agent.aggregate([
      {
        $project: {
          childrenCount: { $size: "$children" },
        },
      },
      {
        $match: {
          childrenCount: { $lt: 5 },
        },
      },
      {
        $count: "count",
      },
    ]);

    // Extract the count from the aggregation result
    const incompleteTreeCount = incompleteTreeResult[0]
      ? incompleteTreeResult[0].count
      : 0;

    res.json({
      approvedAgentCount,
      incompleteTreeCount,
      treesCount,
      districtCount,
    });
  } catch (err) {
    res.status(500).json({ error: "Error counting data" });
    console.log(err);
  }
};

const getHead = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 1;

    const heads = await Head.find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .select("name districtName applicantPhoto")
      .exec();

    if (!heads || heads.length === 0) {
      return res.status(404).json({ message: "No heads found" });
    }

    // Extract the required details for each head
    const headDetails = heads.map((head) => ({
      name: head.name,
      districtName: head.districtName,
      applicantImage: head.applicantPhoto,
    }));

    res.json(headDetails);
  } catch (err) {
    console.error("Error fetching heads:", err);
    res.status(500).json({ error: "Error fetching heads" });
  }
};

const chartData = async (req, res) => {
  try {
    const query = req.query.period;

    if (!["Week", "Month", "Yearly"].includes(query)) {
      return res.status(400).json({ error: "Invalid query type" });
    }

    let match, group, projectFields;
    const now = new Date();
    let startOfPeriod, endOfPeriod;

    if (query === "Week") {
      const startOfWeek = new Date(
        now.setDate(now.getDate() - now.getDay() + 1)
      );
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6); // 6 to include Sunday

      startOfPeriod = startOfWeek;
      endOfPeriod = endOfWeek;

      match = {
        memberCreatedDate: { $gte: startOfWeek, $lt: endOfWeek },
      };
      group = {
        _id: { $dayOfWeek: "$memberCreatedDate" },
        count: { $sum: 1 },
      };
      projectFields = {
        _id: 0,
        day: {
          $switch: {
            branches: [
              { case: { $eq: ["$_id", 1] }, then: "Sun" },
              { case: { $eq: ["$_id", 2] }, then: "Mon" },
              { case: { $eq: ["$_id", 3] }, then: "Tue" },
              { case: { $eq: ["$_id", 4] }, then: "Wed" },
              { case: { $eq: ["$_id", 5] }, then: "Thu" },
              { case: { $eq: ["$_id", 6] }, then: "Fri" },
              { case: { $eq: ["$_id", 7] }, then: "Sat" },
            ],
            default: "Unknown",
          },
        },
        count: 1,
      };
    } else if (query === "Month") {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

      startOfPeriod = startOfMonth;
      endOfPeriod = endOfMonth;

      match = {
        memberCreatedDate: { $gte: startOfMonth, $lt: endOfMonth },
      };
      group = {
        _id: {
          week: { $week: "$memberCreatedDate" },
          month: { $month: "$memberCreatedDate" },
          year: { $year: "$memberCreatedDate" },
        },
        count: { $sum: 1 },
      };
      projectFields = {
        _id: 0,
        week: { $concat: ["Week ", { $toString: "$_id.week" }] },
        count: 1,
      };
    } else if (query === "Yearly") {
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      const endOfYear = new Date(now.getFullYear() + 1, 0, 1);

      startOfPeriod = startOfYear;
      endOfPeriod = endOfYear;

      match = {
        memberCreatedDate: { $gte: startOfYear, $lt: endOfYear },
      };
      group = {
        _id: { $month: "$memberCreatedDate" },
        count: { $sum: 1 },
      };
      projectFields = {
        _id: 0,
        month: {
          $switch: {
            branches: [
              { case: { $eq: ["$_id", 1] }, then: "Jan" },
              { case: { $eq: ["$_id", 2] }, then: "Feb" },
              { case: { $eq: ["$_id", 3] }, then: "Mar" },
              { case: { $eq: ["$_id", 4] }, then: "Apr" },
              { case: { $eq: ["$_id", 5] }, then: "May" },
              { case: { $eq: ["$_id", 6] }, then: "Jun" },
              { case: { $eq: ["$_id", 7] }, then: "Jul" },
              { case: { $eq: ["$_id", 8] }, then: "Aug" },
              { case: { $eq: ["$_id", 9] }, then: "Sep" },
              { case: { $eq: ["$_id", 10] }, then: "Oct" },
              { case: { $eq: ["$_id", 11] }, then: "Nov" },
              { case: { $eq: ["$_id", 12] }, then: "Dec" },
            ],
            default: "Unknown",
          },
        },
        count: 1,
      };
    }

    const data = await Agent.aggregate([
      { $match: match },
      { $group: group },
      { $sort: { "_id.week": 1, "_id.month": 1, "_id.year": 1 } },
      { $project: projectFields },
    ]);

    let result;

    if (query === "Week") {
      const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      result = daysOfWeek.map((day) => {
        const foundDay = data.find((d) => d.day === day);
        return { day, count: foundDay ? foundDay.count : 0 };
      });
    } else if (query === "Month") {
      const weeksInMonth = Array.from(
        {
          length: Math.ceil(
            (endOfPeriod - startOfPeriod) / (7 * 24 * 60 * 60 * 1000)
          ),
        },
        (_, i) => `Week ${i + 1}`
      );
      result = weeksInMonth.map((week) => {
        const foundWeek = data.find((w) => w.week === week);
        return { week, count: foundWeek ? foundWeek.count : 0 };
      });
    } else if (query === "Yearly") {
      const monthsInYear = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      result = monthsInYear.map((month) => {
        const foundMonth = data.find((m) => m.month === month);
        return { month, count: foundMonth ? foundMonth.count : 0 };
      });
    }

    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching chart data:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = { countData, getHead, chartData };
