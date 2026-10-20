import { SupportTicket } from '../models/SupportTicket.js';
import { Customer } from '../models/Customer.js';
import { logAuditEvent } from '../services/auditService.js';
import { ROLES, TICKET_STATUS, TICKET_PRIORITY } from '../config/constants.js';

export const createTicket = async (req, res, next) => {
  try {
    const user = req.user;
    const { category, subject, description, priority = TICKET_PRIORITY.MEDIUM, relatedAccount, relatedTransaction } = req.body;

    let customer = null;
    if (user.role === ROLES.CUSTOMER) {
      customer = await Customer.findOne({ userId: user._id });
    }

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const ticketRef = `TCK-${dateStr}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    const ticket = await SupportTicket.create({
      ticketReference: ticketRef,
      customerId: customer?._id || user._id,
      userId: user._id,
      relatedAccount: relatedAccount || '',
      relatedTransaction: relatedTransaction || '',
      category,
      subject,
      description,
      priority,
      status: TICKET_STATUS.OPEN,
      messages: [
        {
          senderId: user._id,
          senderRole: user.role,
          message: description,
          createdAt: new Date(),
        },
      ],
    });

    await logAuditEvent({
      req,
      action: 'SUPPORT_TICKET_CREATED',
      resourceType: 'SUPPORT_TICKET',
      resourceId: ticketRef,
      outcome: 'SUCCESS',
      metadata: { category, subject },
    });

    return res.status(201).json({
      success: true,
      message: 'Support case submitted successfully. Our team will investigate promptly.',
      data: ticket,
    });
  } catch (error) {
    next(error);
  }
};

export const getTickets = async (req, res, next) => {
  try {
    const { status, category, page = 1, limit = 20 } = req.query;
    const query = {};

    // Customer only sees their tickets
    if (req.user.role === ROLES.CUSTOMER) {
      query.userId = req.user._id;
    }

    if (status) query.status = status;
    if (category) query.category = category;

    const skip = (Number(page) - 1) * Number(limit);
    const [tickets, total] = await Promise.all([
      SupportTicket.find(query)
        .populate('userId', 'fullName email phone role')
        .populate('assignedTo', 'fullName email')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      SupportTicket.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        tickets,
        pagination: {
          total,
          page: Number(page),
          pages: Math.ceil(total / Number(limit)),
          limit: Number(limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getTicketById = async (req, res, next) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id)
      .populate('userId', 'fullName email phone role')
      .populate('assignedTo', 'fullName email')
      .populate('messages.senderId', 'fullName role');

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found.',
        code: 'NOT_FOUND',
      });
    }

    // IDOR
    if (req.user.role === ROLES.CUSTOMER && String(ticket.userId?._id || ticket.userId) !== String(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You cannot view this support case.',
        code: 'ACCESS_DENIED',
      });
    }

    return res.status(200).json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    next(error);
  }
};

export const addTicketMessage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    const user = req.user;

    const ticket = await SupportTicket.findById(id);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found.',
        code: 'NOT_FOUND',
      });
    }

    // IDOR
    if (user.role === ROLES.CUSTOMER && String(ticket.userId) !== String(user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied.',
        code: 'ACCESS_DENIED',
      });
    }

    ticket.messages.push({
      senderId: user._id,
      senderRole: user.role,
      message,
      createdAt: new Date(),
    });

    // Update status if replied by customer or staff
    if (user.role === ROLES.CUSTOMER && ticket.status === TICKET_STATUS.AWAITING_CUSTOMER) {
      ticket.status = TICKET_STATUS.UNDER_REVIEW;
    }

    await ticket.save();

    return res.status(200).json({
      success: true,
      message: 'Message added to support case.',
      data: ticket,
    });
  } catch (error) {
    next(error);
  }
};

export const updateTicketStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, resolutionNotes, assignedTo } = req.body;

    const ticket = await SupportTicket.findById(id);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found.',
        code: 'NOT_FOUND',
      });
    }

    if (status) ticket.status = status;
    if (resolutionNotes) ticket.resolutionNotes = resolutionNotes;
    if (assignedTo) ticket.assignedTo = assignedTo;

    await ticket.save();

    await logAuditEvent({
      req,
      action: 'SUPPORT_TICKET_STATUS_UPDATED',
      resourceType: 'SUPPORT_TICKET',
      resourceId: ticket.ticketReference,
      outcome: 'SUCCESS',
      metadata: { status, resolutionNotes },
    });

    return res.status(200).json({
      success: true,
      message: `Support ticket status updated to ${status}.`,
      data: ticket,
    });
  } catch (error) {
    next(error);
  }
};

