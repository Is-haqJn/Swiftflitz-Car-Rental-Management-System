import { Card, Col, Row } from 'react-bootstrap';
import { SkeletonBlock, SkeletonText } from '@/shared/components/ui/Skeleton';

export function TemplateListSkeleton() {
    return (
        <div className="pb-4">
            {/* Page title */}
            <div className="page-titles mb-3">
                <div className="placeholder-glow mb-1">
                    <span
                        className="placeholder col-3 rounded"
                        style={{ height: '1.3rem' }}
                    />
                </div>
                <div className="placeholder-glow">
                    <span
                        className="placeholder col-6 rounded"
                        style={{ height: '0.75rem' }}
                    />
                </div>
            </div>

            <Row className="g-3">
                {Array.from({ length: 6 }).map((_, i) => (
                    <Col md={6} key={i}>
                        <Card className="h-100">
                            <Card.Body className="d-flex flex-column gap-2">
                                {/* Header row: title + badge */}
                                <div className="d-flex justify-content-between align-items-start">
                                    <div style={{ flex: 1 }}>
                                        <SkeletonBlock
                                            col={6}
                                            height="1rem"
                                            className="mb-1"
                                        />
                                        <SkeletonBlock
                                            col={9}
                                            height="0.7rem"
                                        />
                                    </div>
                                    <div className="placeholder-glow ms-2">
                                        <span
                                            className="placeholder rounded"
                                            style={{
                                                width: 72,
                                                height: '1.4rem',
                                                display: 'inline-block',
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Body text */}
                                <SkeletonText lines={2} className="mt-1" />

                                {/* Footer: date + edit button */}
                                <div className="mt-auto d-flex justify-content-between align-items-center pt-2 border-top placeholder-glow">
                                    <span
                                        className="placeholder col-4 rounded"
                                        style={{ height: '0.7rem' }}
                                    />
                                    <span
                                        className="placeholder rounded"
                                        style={{
                                            width: 60,
                                            height: '1.8rem',
                                            display: 'inline-block',
                                        }}
                                    />
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                ))}
            </Row>
        </div>
    );
}
