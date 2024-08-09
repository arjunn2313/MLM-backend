const Head = require("../../models/districtHead");
const District = require("../../models/district");

//create
const createHead = async (req, res) => {
  try {
    const { phoneNumber, districtName, ...details } = req.body;

    const isMember = await Head.findOne({ phoneNumber });
    const isDistrict = await Head.findOne({ districtName });
    if (isMember) {
      return res.status(404).json({ message: "Member already registered" });
    }

    if (isDistrict) {
      return res
        .status(404)
        .json({ message: "Already district head assigned" });
    }

    const selectedDistrict = await District.findOne({ name: districtName });

    if (!selectedDistrict) {
      return res.status(404).json({ message: "No district found" });
    }

    console.log(req.file);

    if (!req.files || !req.files["applicantPhoto"]) {
      return res.status(400).json({ message: "Applicant photo is required" });
    }

    const createHead = new Head({
      phoneNumber,
      districtName,
      districtId: selectedDistrict._id,
      ...details,
      applicantPhoto: req.files["applicantPhoto"][0].path,
    });

    await createHead.save();

    res
      .status(201)
      .json({ message: "Registration successful", data: createHead });
  } catch (error) {
    res.status(500).json({ message: error.message });
    console.log(error);
  }
};

//get all
const getAllHeads = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";
    const districtName = req.query.districtName || "";
    const skip = (page - 1) * limit;

    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { phoneNumber: { $regex: search, $options: "i" } },
      ];
    }
    if (districtName) {
      query.districtName = districtName;
    }

    const count = await Head.countDocuments(query);

    const heads = await Head.find(query)
      .populate("districtId", "sections")
      .sort({ _id: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    const memberListWithSerial = heads.map((head, index) => ({
      slNo: skip + index + 1,
      name: head.name,
      phoneNumber: head.phoneNumber,
      createdAt: head.createdAt,
      districtName: head.districtName,
      districtId: head.districtId,
      districtSection: head.districtId?.sections,
      _id: head._id,
    }));

    const totalPages = Math.ceil(count / limit);

    res.json({
      members: memberListWithSerial,
      totalPages,
      currentPage: page,
    });
  } catch (err) {
    console.error("Error fetching members:", err);
    res.status(500).json({ error: "Error fetching members" });
  }
};

//get by id
const headPreview = async (req, res) => {
  const memberId = req.params.memberId;

  try {
    const member = await Head.findById({ _id: memberId });
    if (!member) {
      return res.status(404).json({ error: "Head not found" });
    }
    res.status(200).json(member);
  } catch (error) {
    console.error("Error finding member:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const checkHeadMobile = async (req, res) => {
  const phoneNumber = req.params.phoneNumber;

  try {
    const phone = await Head.findOne({ phoneNumber });
    console.log("hi");
    if (phone) {
      return res
        .status(404)
        .json({ error: "A member is already registered with this number" });
    }

    res.status(200).json("Good");
  } catch (error) {
    console.error("Error finding member:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const checkHeadDistrict = async (req, res) => {
  try {
    // Fetch all districts
    const allDistricts = await District.find({}, 'name');
    
    // Fetch all head district names
    const headDistricts = await Head.find({}, 'districtName');

    // Convert headDistricts to an array of district names for easier comparison
    const headDistrictNames = headDistricts.map(head => head.districtName);

    // Filter districts that do not have a matching district name in headDistrictNames
    const availableDistricts = allDistricts
      .filter(district => !headDistrictNames.includes(district.name))
      .map(district => district.name); // Extract only the names

    // Return the list of available district names as an array
    res.status(200).json(availableDistricts);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};


module.exports = {
  createHead,
  getAllHeads,
  headPreview,
  checkHeadMobile,
  checkHeadDistrict,
};
