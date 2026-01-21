import PDFDocument from "pdfkit";
import Product from "../models/asset.model.js";
import Ticket from "../models/ticket.model.js";
import AuditLog from "../models/auditLog.model.js";
import User from "../models/user.model.js";
import { createAuditLog } from "./audit.controller.js";
const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
    }).format(amount || 0);
};
const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
};
export const generateAssetReport = async (req, res) => {
    try {
        const { category, status, format = "pdf" } = req.query;
        let query = {};
        if (category) query.category = category;
        if (status) query.status = status;

        const assets = await Product.find(query)
            .populate("assignedTo", "name email department")
            .sort({ category: 1, name: 1 });
        const doc = new PDFDocument({ margin: 50, size: "A4" });
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
            "Content-Disposition",
            `attachment; filename=asset-inventory-${Date.now()}.pdf`
        );

        doc.pipe(res);
        doc.fontSize(24).font("Helvetica-Bold").text("IT Asset Inventory Report", {
            align: "center",
        });
        doc.moveDown(0.5);
        doc.fontSize(10).font("Helvetica").fillColor("#666666")
            .text(`Generated: ${new Date().toLocaleString()}`, { align: "center" });
        doc.text(`Total Assets: ${assets.length}`, { align: "center" });
        doc.moveDown(2);
        const stats = {
            total: assets.length,
            available: assets.filter((a) => a.status === "Available").length,
            assigned: assets.filter((a) => a.status === "Assigned").length,
            maintenance: assets.filter((a) => a.status === "Maintenance").length,
            retired: assets.filter((a) => a.status === "Retired").length,
            totalValue: assets.reduce((sum, a) => sum + (a.price || 0), 0),
        };

        doc.fontSize(14).font("Helvetica-Bold").fillColor("#000000").text("Summary");
        doc.moveDown(0.5);

        const summaryY = doc.y;
        doc.fontSize(10).font("Helvetica");
        doc.rect(50, summaryY, 495, 80).stroke("#e2e8f0");
        doc.text(`Available: ${stats.available}`, 70, summaryY + 15);
        doc.text(`Assigned: ${stats.assigned}`, 70, summaryY + 35);
        doc.text(`Maintenance: ${stats.maintenance}`, 70, summaryY + 55);
        doc.text(`Retired: ${stats.retired}`, 250, summaryY + 15);
        doc.text(`Total Value: ${formatCurrency(stats.totalValue)}`, 250, summaryY + 35);
        doc.text(`Report Filters: ${category || "All"} | ${status || "All"}`, 250, summaryY + 55);

        doc.y = summaryY + 100;
        doc.fontSize(14).font("Helvetica-Bold").text("Asset Details");
        doc.moveDown(0.5);
        const tableTop = doc.y;
        const colWidths = [120, 80, 70, 70, 80, 75];
        const headers = ["Asset Name", "Asset Tag", "Category", "Status", "Value", "Assigned To"];

        doc.fontSize(9).font("Helvetica-Bold").fillColor("#ffffff");
        doc.rect(50, tableTop, 495, 20).fill("#1e293b");

        let xPos = 55;
        headers.forEach((header, i) => {
            doc.text(header, xPos, tableTop + 6, { width: colWidths[i], align: "left" });
            xPos += colWidths[i];
        });
        let yPos = tableTop + 25;
        doc.font("Helvetica").fillColor("#000000");

        assets.forEach((asset, index) => {
            if (yPos > 750) {
                doc.addPage();
                yPos = 50;
            }
            if (index % 2 === 0) {
                doc.rect(50, yPos - 3, 495, 18).fill("#eeeeee");
            }

            doc.fillColor("#000000");
            xPos = 55;

            const rowData = [
                (asset.name || "").substring(0, 20),
                asset.assetTag || "N/A",
                asset.category || "N/A",
                asset.status || "N/A",
                formatCurrency(asset.price),
                asset.assignedTo?.name?.substring(0, 12) || "—",
            ];

            rowData.forEach((data, i) => {
                doc.fontSize(8).text(data, xPos, yPos, { width: colWidths[i], align: "left" });
                xPos += colWidths[i];
            });

            yPos += 18;
        });
        doc.fontSize(8).fillColor("#999999")
            .text(
                "This report is confidential. IT Asset Management System.",
                50,
                doc.page.height - 50,
                { align: "center" }
            );

        doc.end();
        await createAuditLog({
            userId: req.user._id,
            action: "REPORT_GENERATED",
            resource: "Report",
            metadata: { type: "Asset Inventory", filters: { category, status } },
            ipAddress: req.ip,
        });

    } catch (error) {
        console.error("Asset report error:", error);
        res.status(500).json({ message: "Failed to generate report", error: error.message });
    }
};
export const generateTicketReport = async (req, res) => {
    try {
        const { status, priority, startDate, endDate } = req.query;

        let query = {};
        if (status) query.status = status;
        if (priority) query.priority = priority;
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        const tickets = await Ticket.find(query)
            .populate("user", "name email")
            .populate("asset", "name assetTag")
            .populate("assignedTo", "name")
            .sort({ createdAt: -1 });

        const doc = new PDFDocument({ margin: 50, size: "A4" });

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
            "Content-Disposition",
            `attachment; filename=ticket-report-${Date.now()}.pdf`
        );

        doc.pipe(res);
        doc.fontSize(24).font("Helvetica-Bold").text("Support Ticket Report", {
            align: "center",
        });
        doc.moveDown(0.5);
        doc.fontSize(10).font("Helvetica").fillColor("#666666")
            .text(`Generated: ${new Date().toLocaleString()}`, { align: "center" });
        doc.moveDown(2);
        const stats = {
            total: tickets.length,
            open: tickets.filter((t) => t.status === "Open").length,
            inProgress: tickets.filter((t) => t.status === "In Progress").length,
            resolved: tickets.filter((t) => t.status === "Resolved").length,
            closed: tickets.filter((t) => t.status === "Closed").length,
            critical: tickets.filter((t) => t.priority === "Critical").length,
            high: tickets.filter((t) => t.priority === "High").length,
        };

        doc.fontSize(14).font("Helvetica-Bold").fillColor("#000000").text("Summary Statistics");
        doc.moveDown(0.5);

        const summaryY = doc.y;
        doc.fontSize(10).font("Helvetica");
        doc.rect(50, summaryY, 495, 60).stroke("#e2e8f0");

        doc.text(`Total Tickets: ${stats.total}`, 70, summaryY + 12);
        doc.text(`Open: ${stats.open}`, 70, summaryY + 30);
        doc.text(`In Progress: ${stats.inProgress}`, 180, summaryY + 30);
        doc.text(`Resolved: ${stats.resolved}`, 290, summaryY + 30);
        doc.text(`Critical Priority: ${stats.critical}`, 400, summaryY + 30);
        doc.text(`High Priority: ${stats.high}`, 400, summaryY + 45);

        doc.y = summaryY + 80;
        doc.fontSize(14).font("Helvetica-Bold").text("Ticket Details");
        doc.moveDown(0.5);

        const tableTop = doc.y;
        const colWidths = [70, 130, 70, 70, 70, 85];
        const headers = ["Ticket #", "Title", "Priority", "Status", "Created", "Reporter"];

        doc.fontSize(9).font("Helvetica-Bold").fillColor("#ffffff");
        doc.rect(50, tableTop, 495, 20).fill("#1e293b");

        let xPos = 55;
        headers.forEach((header, i) => {
            doc.text(header, xPos, tableTop + 6, { width: colWidths[i] });
            xPos += colWidths[i];
        });

        let yPos = tableTop + 25;
        doc.font("Helvetica").fillColor("#000000");

        tickets.forEach((ticket, index) => {
            if (yPos > 750) {
                doc.addPage();
                yPos = 50;
            }

            if (index % 2 === 0) {
                doc.rect(50, yPos - 3, 495, 18).fill("#eeeeee");
            }

            doc.fillColor("#000000");
            xPos = 55;
            const priorityColor = {
                Critical: "#dc2626",
                High: "#ea580c",
                Medium: "#ca8a04",
                Low: "#16a34a",
            };

            const rowData = [
                ticket.ticketNumber || "N/A",
                (ticket.title || "").substring(0, 22),
                ticket.priority,
                ticket.status,
                formatDate(ticket.createdAt),
                ticket.user?.name?.substring(0, 12) || "N/A",
            ];

            rowData.forEach((data, i) => {
                if (i === 2) doc.fillColor(priorityColor[data] || "#000000");
                else doc.fillColor("#000000");
                doc.fontSize(8).text(data, xPos, yPos, { width: colWidths[i] });
                xPos += colWidths[i];
            });

            yPos += 18;
        });
        doc.fontSize(8).fillColor("#999999")
            .text(
                "Confidential - IT Support Report",
                50,
                doc.page.height - 50,
                { align: "center" }
            );

        doc.end();

        await createAuditLog({
            userId: req.user._id,
            action: "REPORT_GENERATED",
            resource: "Report",
            metadata: { type: "Ticket Report", filters: { status, priority } },
            ipAddress: req.ip,
        });

    } catch (error) {
        console.error("Ticket report error:", error);
        res.status(500).json({ message: "Failed to generate report", error: error.message });
    }
};
export const generateAuditReport = async (req, res) => {
    try {
        const { startDate, endDate, action, resource } = req.query;

        let query = {};
        if (action) query.action = action;
        if (resource) query.resource = resource;
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        const logs = await AuditLog.find(query)
            .populate("userId", "name email")
            .sort({ createdAt: -1 })
            .limit(500);

        const doc = new PDFDocument({ margin: 50, size: "A4", layout: "landscape" });

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
            "Content-Disposition",
            `attachment; filename=audit-report-${Date.now()}.pdf`
        );

        doc.pipe(res);
        doc.fontSize(24).font("Helvetica-Bold").text("System Audit Log Report", {
            align: "center",
        });
        doc.moveDown(0.5);
        doc.fontSize(10).font("Helvetica").fillColor("#666666")
            .text(`Generated: ${new Date().toLocaleString()} | Records: ${logs.length}`, { align: "center" });
        doc.moveDown(2);
        const tableTop = doc.y;
        const colWidths = [120, 100, 120, 80, 100, 200];
        const headers = ["Timestamp", "User", "Action", "Resource", "Status", "Details"];

        doc.fontSize(9).font("Helvetica-Bold").fillColor("#ffffff");
        doc.rect(50, tableTop, 720, 20).fill("#1e293b");

        let xPos = 55;
        headers.forEach((header, i) => {
            doc.text(header, xPos, tableTop + 6, { width: colWidths[i] });
            xPos += colWidths[i];
        });

        let yPos = tableTop + 25;
        doc.font("Helvetica").fillColor("#000000");

        logs.forEach((log, index) => {
            if (yPos > 520) {
                doc.addPage();
                yPos = 50;
            }

            if (index % 2 === 0) {
                doc.rect(50, yPos - 3, 720, 16).fill("#eeeeee");
            }

            doc.fillColor("#000000");
            xPos = 55;

            const rowData = [
                formatDate(log.createdAt) + " " + new Date(log.createdAt).toLocaleTimeString(),
                log.userId?.name || "System",
                log.action || "N/A",
                log.resource || "N/A",
                log.status || "SUCCESS",
                (JSON.stringify(log.metadata || {}).substring(0, 35)) || "—",
            ];

            rowData.forEach((data, i) => {
                doc.fontSize(7).text(data, xPos, yPos, { width: colWidths[i] });
                xPos += colWidths[i];
            });

            yPos += 16;
        });

        doc.end();

        await createAuditLog({
            userId: req.user._id,
            action: "REPORT_GENERATED",
            resource: "Report",
            metadata: { type: "Audit Log" },
            ipAddress: req.ip,
        });

    } catch (error) {
        console.error("Audit report error:", error);
        res.status(500).json({ message: "Failed to generate report", error: error.message });
    }
};
export const generateUserAssetsReport = async (req, res) => {
    try {
        const users = await User.find({ role: { $ne: "admin" } }).select("name email department");

        const userAssets = await Promise.all(
            users.map(async (user) => {
                const assets = await Product.find({ assignedTo: user._id }).select("name assetTag category price");
                return {
                    user,
                    assets,
                    totalValue: assets.reduce((sum, a) => sum + (a.price || 0), 0),
                };
            })
        );

        const doc = new PDFDocument({ margin: 50, size: "A4" });

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
            "Content-Disposition",
            `attachment; filename=user-assets-report-${Date.now()}.pdf`
        );

        doc.pipe(res);
        doc.fontSize(24).font("Helvetica-Bold").text("User Asset Assignment Report", {
            align: "center",
        });
        doc.moveDown(0.5);
        doc.fontSize(10).font("Helvetica").fillColor("#666666")
            .text(`Generated: ${new Date().toLocaleString()}`, { align: "center" });
        doc.moveDown(2);
        userAssets.filter(ua => ua.assets.length > 0).forEach((ua, index) => {
            if (doc.y > 650) doc.addPage();

            doc.fontSize(12).font("Helvetica-Bold").fillColor("#1e293b")
                .text(`${ua.user.name} (${ua.user.email})`);
            doc.fontSize(9).font("Helvetica").fillColor("#666666")
                .text(`Department: ${ua.user.department || "N/A"} | Total Value: ${formatCurrency(ua.totalValue)}`);
            doc.moveDown(0.3);
            ua.assets.forEach((asset) => {
                doc.fontSize(9).fillColor("#000000")
                    .text(`  • ${asset.name} (${asset.assetTag}) - ${asset.category} - ${formatCurrency(asset.price)}`);
            });

            doc.moveDown(1);
        });
        const totalAssigned = userAssets.reduce((sum, ua) => sum + ua.assets.length, 0);
        const totalValue = userAssets.reduce((sum, ua) => sum + ua.totalValue, 0);

        doc.moveDown(1);
        doc.fontSize(12).font("Helvetica-Bold").fillColor("#000000")
            .text(`Total Assigned Assets: ${totalAssigned} | Total Value: ${formatCurrency(totalValue)}`);

        doc.end();

        await createAuditLog({
            userId: req.user._id,
            action: "REPORT_GENERATED",
            resource: "Report",
            metadata: { type: "User Assets" },
            ipAddress: req.ip,
        });

    } catch (error) {
        console.error("User assets report error:", error);
        res.status(500).json({ message: "Failed to generate report", error: error.message });
    }
};