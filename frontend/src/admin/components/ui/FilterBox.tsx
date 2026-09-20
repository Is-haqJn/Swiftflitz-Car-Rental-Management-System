import { useState, type ReactNode } from 'react';
import { Collapse } from 'react-bootstrap';
import { FaFilter, FaAngleUp, FaAngleDown } from 'react-icons/fa';

interface FilterBoxProps {
    children: ReactNode;
    defaultOpen?: boolean;
    title?: string;
}

/**
 * Collapsible filter panel - based on the CMS content.jsx template pattern.
 * Wraps filter inputs in a toggleable box.
 */
export default function FilterBox({
    children,
    defaultOpen = true,
    title = 'Filter',
}: FilterBoxProps) {
    const [open, setOpen] = useState(defaultOpen);

    return (
        <div
            className="sfz-filter-box mb-3 rounded overflow-hidden"
            style={{
                border: '1px solid #e9ecef',
                borderLeft: '3px solid #6571ff',
                background: '#fff',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            }}
        >
            {/* Header */}
            <div
                className="sfz-filter-box-header content-title SlideToolHeader d-flex justify-content-between align-items-center py-2 px-3"
                style={{
                    cursor: 'pointer',
                    borderBottom: open ? '1px solid #e9ecef' : 'none',
                }}
                onClick={() => setOpen(prev => !prev)}
            >
                <div className="d-flex align-items-center gap-2">
                    <FaFilter size={11} color="#6571ff" />
                    <span className="fw-semibold fs-14 text-dark">{title}</span>
                </div>
                <span className="text-muted" style={{ fontSize: 13 }}>
                    {open ? <FaAngleUp /> : <FaAngleDown />}
                </span>
            </div>

            {/* Body */}
            <Collapse in={open}>
                <div className="cm-content-body form excerpt">
                    <div className="p-3">{children}</div>
                </div>
            </Collapse>
        </div>
    );
}
