import { SetMetadata } from '@nestjs/common';
import { AMQP_DEFAULT_CONNECTION, QUEUE_LISTEN_METADATA_KEY } from '../../constant';

import { ListenerMetadata } from '../../domain';
import { ListenOptions } from '../../interface';

interface ListenOverload {
  <C extends string = string>(source: string, connection?: C): MethodDecorator;
  <T, C extends string = string>(source: string, options: ListenOptions<T>, connection?: C): MethodDecorator;
}

/**
 * Decorator for adding handler to a queue's messages
 *
 * ```ts
 * @Listen<TestDto>('test-queue', { type: TestDto })
 * public async listenForTestQueue(data: TestDto, control: MessageControl): Promise<void> {
 *    console.log('Message arrived on test-queue with data:', data);
 *    control.accept();
 *  }
 * ```
 *
 * @param {string} source The name of the queue which will listen to.
 * @param {object} [options] Options for the queue listening.
 * @param {string} [connection] Name of the connection the queue belongs.
 *
 * @public
 */
export const Listen: ListenOverload = <T, C extends string = string>(
  source: string,
  options?: ListenOptions<T> | C,
  connection?: C,
): MethodDecorator => {
  return (target: Record<string, any>, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    const metadata = new ListenerMetadata<T, C>();

    const conn = connection ?? (typeof options === 'string' ? (options as C) : (AMQP_DEFAULT_CONNECTION as C));
    const opt = typeof options === 'object' ? options : {};

    metadata.source = source;
    metadata.options = opt;
    metadata.connection = conn;

    metadata.targetName = target.constructor.name;
    metadata.target = target.constructor;

    metadata.callback = descriptor.value;
    metadata.callbackName = typeof propertyKey === 'string' ? propertyKey : propertyKey.toString();

    SetMetadata<string, ListenerMetadata<T, C>>(QUEUE_LISTEN_METADATA_KEY, metadata)(target, propertyKey, descriptor);
  };
};
