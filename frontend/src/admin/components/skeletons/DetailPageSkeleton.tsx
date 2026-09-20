import { Row, Col, Card } from 'react-bootstrap';
import {
    SkeletonBlock,
    SkeletonFormRows,
} from '@/shared/components/ui/Skeleton';

interface DetailPageSkeletonProps {
    /* Show an image/avatar placeholder on the left side of the header */
    withImage?: boolean;
    /* Number of info cards to render below the header */
    cards?: number;
}

export function DetailPageSkeleton({
    withImage = false,
    cards = 2,
}: DetailPageSkeletonProps) {
    return (
        <div className="pb-4">
            {/* Breadcrumb */}
            <div className="mb-3 placeholder-glow">
                <span
                    className="placeholder col-3 rounded"
                    style={{ height: '0.7rem' }}
                />
            </div>

            {/* Header card */}
            <Card className="border-0 shadow-sm mb-4">
                <Card.Body>
                    <Row className="align-items-center g-3">
                        {withImage && (
                            <Col xs="auto">
                                <div className="placeholder-glow">
                                    <span
                                        className="placeholder rounded"
                                        style={{
                                            width: 120,
                                            height: 90,
                                            display: 'block',
                                        }}
                                    />
                                </div>
                            </Col>
                        )}
                        <Col>
                            {/* Title */}
                            <SkeletonBlock
                                col={5}
                                height="1.4rem"
                                className="mb-2"
                            />
                            {/* Sub-lines */}
                            <SkeletonBlock
                                col={4}
                                height="0.85rem"
                                className="mb-1"
                            />
                            <SkeletonBlock
                                col={3}
                                height="0.75rem"
                                className="mb-1"
                            />
                            <SkeletonBlock
                                col={2}
                                height="1.5rem"
                                className="mt-2"
                            />
                        </Col>
                        <Col xs="auto">
                            {/* Action buttons placeholder */}
                            <div className="placeholder-glow d-flex gap-2">
                                <span
                                    className="placeholder rounded"
                                    style={{
                                        width: 80,
                                        height: '2rem',
                                        display: 'inline-block',
                                    }}
                                />
                                <span
                                    className="placeholder rounded"
                                    style={{
                                        width: 80,
                                        height: '2rem',
                                        display: 'inline-block',
                                    }}
                                />
                            </div>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* Info cards */}
            <Row className="g-3">
                {Array.from({ length: cards }).map((_, i) => (
                    <Col md={cards > 2 ? 4 : 6} key={i}>
                        <Card className="border-0 shadow-sm h-100">
                            <Card.Header className="bg-white border-bottom">
                                <div className="placeholder-glow">
                                    <span
                                        className="placeholder col-4 rounded"
                                        style={{ height: '0.9rem' }}
                                    />
                                </div>
                            </Card.Header>
                            <Card.Body>
                                <SkeletonFormRows rows={4} />
                            </Card.Body>
                        </Card>
                    </Col>
                ))}
            </Row>
        </div>
    );
}
