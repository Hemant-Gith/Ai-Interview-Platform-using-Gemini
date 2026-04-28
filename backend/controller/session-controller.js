import Question from "../models/question-model.js";
import Session from "../models/session-model.js";

// @desc    Create a new session
// @route   POST /api/sessions/create
// @access  Private
export const createSession = async (req, res) => {
  try {
    const { role, experience, topicsToFocus, description, questions } = req.body;
    const userId = req.user._id;

    const session = await Session.create({
      user: userId,
      role,
      experience,
      topicsToFocus,
      description,
    });

    const questionDocs = await Promise.all(
      (questions || []).map(async (q) => {
        const question = await Question.create({
          session: session._id,
          question: q.question,
          answer: q.answer || "",
          note: q.note || "",
          isPinned: q.isPinned || false,
        });
        return question._id;
      }),
    );

    session.questions = questionDocs;
    await session.save();

    res.status(201).json({ success: true, session });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

// @desc    Get all sessions for the logged-in user
// @route   GET /api/sessions/my-sessions
// @access  Private
export const getMySessions = async (req, res) => {
  try {
    const userId = req.user._id;
    const sessions = await Session.find({ user: userId })
      .sort({ createdAt: -1 })
      .populate("questions");
    res.status(200).json({ success: true, count: sessions.length, sessions });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// @desc    Get a session by ID
// @route   GET /api/sessions/:id
// @access  Private
export const getSessionById = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id)
      .populate("questions")
      .populate("user", "name email");

    if (!session) {
      return res.status(404).json({ success: false, message: "Session not found" });
    }

    if (session.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    res.status(200).json({ success: true, session });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// @desc    Delete a session and all its questions
// @route   DELETE /api/sessions/:id
// @access  Private
export const deleteSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);

    if (!session) {
      return res.status(404).json({ success: false, message: "Session not found" });
    }

    if (session.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    await Question.deleteMany({ session: session._id });
    await session.deleteOne();

    res.status(200).json({ success: true, message: "Session deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// @desc    Toggle pin on a question
// @route   PATCH /api/sessions/questions/:questionId/pin
// @access  Private
export const togglePinQuestion = async (req, res) => {
  try {
    const question = await Question.findById(req.params.questionId);

    if (!question) {
      return res.status(404).json({ success: false, message: "Question not found" });
    }

    question.isPinned = !question.isPinned;
    await question.save();

    res.status(200).json({ success: true, isPinned: question.isPinned });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// @desc    Update note on a question
// @route   PATCH /api/sessions/questions/:questionId/note
// @access  Private
export const updateQuestionNote = async (req, res) => {
  try {
    const { note } = req.body;
    const question = await Question.findById(req.params.questionId);

    if (!question)
      return res.status(404).json({ success: false, message: "Question not found" });

    question.note = note ?? "";
    await question.save();

    res.status(200).json({ success: true, note: question.note });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// @desc    Toggle save/bookmark on a session
// @route   PATCH /api/sessions/:id/save
// @access  Private
export const toggleSaveSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);

    if (!session)
      return res.status(404).json({ success: false, message: "Session not found" });

    if (session.user.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: "Not authorized" });

    session.isSaved = !session.isSaved;
    await session.save();

    res.status(200).json({ success: true, isSaved: session.isSaved });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
