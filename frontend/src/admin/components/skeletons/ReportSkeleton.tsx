import { Row, Col, Card } from 'react-bootstrap';
import { SkeletonStatCard } from '@/shared/components/ui/Skeleton';
import { ChartSkeleton } from './ChartSkeleton';

interface ReportSkeletonProps {
    statCards?: number;
}

export function ReportSkeleton({ statCards = 4 }: ReportSkeletonProps) {
    return (
        <div className="pb-4">
            {/* Stat cards row */}
            <Row className="g-3 mb-4">
                {Array.from({ length: statCards }).map((_, i) => (
                    <Col key={i} xl={Math.floor(12 / statCards)} md={6} xs={12}>
                        <SkeletonStatCard />
                    </Col>
                ))}
            </Row>

            {/* Chart area */}
            <Card className="border-0 shadow-sm mb-4">
                <Card.Header className="bg-white border-bottom">
                    <div className="placeholder-glow d-flex justify-content-between align-items-center">
                        <span
                            className="placeholder col-4 rounded"
                            style={{ height: '1rem' }}
                        />
                        <div className="d-flex gap-1">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <span
                                    key={i}
                                    className="placeholder rounded"
                                    style={{
                                        width: 54,
                                        height: '1.6rem',
                                        display: 'inline-block',
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                </Card.Header>
                <Card.Body className="pt-2 pb-0">
                    <ChartSkeleton height={280} />
                </Card.Body>
            </Card>

            {/* Secondary cards row */}
            <Row className="g-3">
                <Col md={6}>
                    <Card className="border-0 shadow-sm">
                        <Card.Header className="bg-white border-bottom">
                            <div className="placeholder-glow">
                                <span
                                    className="placeholder col-5 rounded"
                                    style={{ height: '0.9rem' }}
                                />
                            </div>
                        </Card.Header>
                        <Card.Body>
                            <ChartSkeleton height={200} />
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={6}>
                    <Card className="border-0 shadow-sm">
                        <Card.Header className="bg-white border-bottom">
                            <div className="placeholder-glow">
                                <span
                                    className="placeholder col-5 rounded"
                                    style={{ height: '0.9rem' }}
                                />
                            </div>
                        </Card.Header>
                        <Card.Body>
                            <ChartSkeleton height={200} />
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </div>
    );
}
