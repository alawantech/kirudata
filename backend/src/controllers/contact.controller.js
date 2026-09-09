const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const ok = (res, data = {}) =>
  res.status(200).json({ status: "success", ...data });
const fail = (res, msg, code = 400) =>
  res.status(code).json({ status: "error", msg });

exports.submitContact = async (req, res) => {
  try {
    const { name, phone, email, message } = req.body;
    if (!name || !name.trim()) return fail(res, "Name is required.");
    if (!phone || !phone.trim()) return fail(res, "Phone number is required.");
    if (!email || !email.trim()) return fail(res, "Email address is required.");
    if (!message || !message.trim()) return fail(res, "Message is required.");

    // Basic email format check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return fail(res, "Please enter a valid email address.");
    }

    const userId = req.user ? req.user.id : 0;
    await prisma.contact.create({
      data: {
        userId,
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim().toLowerCase(),
        message: message.trim(),
      },
    });
    return ok(res, {
      msg: "Message received! Your message has been reviewed and we will get back to you shortly.",
    });
  } catch (e) {
    console.error(e);
    return fail(res, "Failed to send message.", 500);
  }
};
